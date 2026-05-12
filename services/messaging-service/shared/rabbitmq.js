// ============================================
// SHARED: RabbitMQ Connection Helper
// Used by all services that need to publish or consume messages
// ============================================

const amqp = require('amqplib');

let connection = null;
let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

// Exchange names (like topics in Kafka)
const EXCHANGES = {
  NOTIFICATIONS: 'notifications_exchange',
  EVENTS: 'events_exchange',
};

// Queue names
const QUEUES = {
  EMAIL_NOTIFICATIONS: 'email_notifications',
  PUSH_NOTIFICATIONS: 'push_notifications',
  IN_APP_NOTIFICATIONS: 'in_app_notifications',
};

// Routing keys (like event types)
const ROUTING_KEYS = {
  POST_CREATED: 'post.created',
  COMMENT_CREATED: 'comment.created',
  VOTE_CREATED: 'vote.created',
  USER_REGISTERED: 'user.registered',
  MESSAGE_SENT: 'message.sent',
  REVIEW_SUBMITTED: 'review.submitted',
  SALARY_SUBMITTED: 'salary.submitted',
  MENTION_DETECTED: 'mention.detected',
};

/**
 * Connect to RabbitMQ with retry logic
 */
async function connect(retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[RabbitMQ] Connecting (attempt ${attempt}/${retries})...`);
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      // Set up exchanges (topic type allows pattern-based routing)
      await channel.assertExchange(EXCHANGES.NOTIFICATIONS, 'topic', { durable: true });
      await channel.assertExchange(EXCHANGES.EVENTS, 'topic', { durable: true });

      // Handle connection errors
      connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
        connection = null;
        channel = null;
      });

      connection.on('close', () => {
        console.log('[RabbitMQ] Connection closed');
        connection = null;
        channel = null;
      });

      console.log('[RabbitMQ] Connected successfully!');
      return channel;
    } catch (error) {
      console.error(`[RabbitMQ] Connection attempt ${attempt} failed:`, error.message);
      if (attempt === retries) {
        console.error('[RabbitMQ] All retry attempts failed. Running without RabbitMQ.');
        return null;
      }
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}

/**
 * Get or create a channel
 */
async function getChannel() {
  if (!channel) {
    await connect();
  }
  return channel;
}

/**
 * Publish a message to an exchange
 * @param {string} exchange - The exchange name
 * @param {string} routingKey - The routing key (e.g., 'post.created')
 * @param {object} message - The message payload
 */
async function publish(exchange, routingKey, message) {
  try {
    const ch = await getChannel();
    if (!ch) {
      console.warn('[RabbitMQ] No channel available, message dropped:', routingKey);
      return false;
    }

    const payload = Buffer.from(JSON.stringify({
      ...message,
      timestamp: new Date().toISOString(),
      routingKey,
    }));

    ch.publish(exchange, routingKey, payload, {
      persistent: true, // Survive broker restart
      contentType: 'application/json',
    });

    console.log(`[RabbitMQ] Published: ${routingKey}`, JSON.stringify(message).slice(0, 100));
    return true;
  } catch (error) {
    console.error('[RabbitMQ] Publish error:', error.message);
    return false;
  }
}

/**
 * Subscribe to messages from a queue
 * @param {string} queueName - The queue to consume from
 * @param {string} exchange - The exchange to bind to
 * @param {string|string[]} routingKeys - Routing key pattern(s) to match
 * @param {function} handler - Message handler function
 */
async function subscribe(queueName, exchange, routingKeys, handler) {
  try {
    const ch = await getChannel();
    if (!ch) {
      console.warn('[RabbitMQ] No channel available for subscription');
      return;
    }

    // Ensure queue exists
    await ch.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '', // Send failed messages to default exchange
        'x-message-ttl': 86400000,    // Messages expire after 24 hours
      },
    });

    // Bind queue to exchange with routing keys
    const keys = Array.isArray(routingKeys) ? routingKeys : [routingKeys];
    for (const key of keys) {
      await ch.bindQueue(queueName, exchange, key);
    }

    // Set prefetch to 1 so we process one message at a time
    await ch.prefetch(1);

    // Start consuming
    ch.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        console.log(`[RabbitMQ] Received: ${msg.fields.routingKey}`, JSON.stringify(content).slice(0, 100));

        await handler(content, msg.fields.routingKey);

        // Acknowledge the message (remove from queue)
        ch.ack(msg);
      } catch (error) {
        console.error('[RabbitMQ] Handler error:', error.message);
        // Reject and don't requeue (sends to dead letter)
        ch.nack(msg, false, false);
      }
    });

    console.log(`[RabbitMQ] Subscribed: ${queueName} <- [${keys.join(', ')}]`);
  } catch (error) {
    console.error('[RabbitMQ] Subscribe error:', error.message);
  }
}

/**
 * Close the connection gracefully
 */
async function close() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('[RabbitMQ] Connection closed gracefully');
  } catch (error) {
    console.error('[RabbitMQ] Close error:', error.message);
  }
}

module.exports = {
  connect,
  getChannel,
  publish,
  subscribe,
  close,
  EXCHANGES,
  QUEUES,
  ROUTING_KEYS,
};
