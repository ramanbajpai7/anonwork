// ============================================
// NOTIFICATION SERVICE - RabbitMQ Consumer
// ============================================
// This service is a WORKER. It doesn't receive HTTP requests from users.
// Instead, it LISTENS to RabbitMQ queues and:
//   1. Creates in-app notifications in the database
//   2. Sends email notifications via Nodemailer
// This is the key example of asynchronous, event-driven architecture.
// ============================================

const express = require('express');
const nodemailer = require('nodemailer');
const { createPool, query } = require('../../shared/database');
const { subscribe, connect: connectRabbitMQ, EXCHANGES, QUEUES, ROUTING_KEYS } = require('../../shared/rabbitmq');

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 4003;
app.use(express.json());

const DATABASE_URL = process.env.DATABASE_URL;
let db;
async function initDB() { db = createPool(DATABASE_URL); }

// ============ EMAIL TRANSPORTER ============

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

async function sendEmail(to, subject, html) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email] (mock) To: ${to} | Subject: ${subject}`);
    return true;
  }
  try {
    await transporter.sendMail({
      from: `"AnonWork" <${process.env.EMAIL_USER}>`, to, subject, html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Send failed:', error.message);
    return false;
  }
}

// ============ IN-APP NOTIFICATION HELPER ============

async function createNotification(userId, type, title, body, data = {}) {
  try {
    await query(db,
      `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(data)]
    );
    console.log(`[Notification] Created for user ${userId}: ${title}`);
  } catch (error) {
    console.error('[Notification] Create error:', error.message);
  }
}

// ============ EVENT HANDLERS ============
// Each handler processes a specific type of RabbitMQ message

async function handlePostCreated(data) {
  // Create "post published" notification for the author
  await createNotification(
    data.authorId, 'milestone',
    'Your post has been published! 🎉',
    data.title, { postId: data.postId }
  );
}

async function handleCommentCreated(data) {
  // Get post author to notify them
  const posts = await query(db, 'SELECT author_id, title FROM posts WHERE id = $1', [data.postId]);
  if (!posts.length) return;
  const post = posts[0];

  // Don't notify if user commented on their own post
  if (post.author_id === data.authorId) return;

  const commenter = await query(db, 'SELECT anon_username FROM users WHERE id = $1', [data.authorId]);
  const username = commenter[0]?.anon_username || 'Someone';

  if (data.parentCommentId) {
    // Reply notification
    const parent = await query(db, 'SELECT author_id FROM comments WHERE id = $1', [data.parentCommentId]);
    if (parent.length && parent[0].author_id !== data.authorId) {
      await createNotification(parent[0].author_id, 'reply',
        `${username} replied to your comment`, data.body?.slice(0, 100),
        { postId: data.postId });
    }
  } else {
    // Comment notification
    await createNotification(post.author_id, 'comment',
      `${username} commented on your post`, data.body?.slice(0, 100),
      { postId: data.postId, postTitle: post.title });
  }
}

async function handleVoteCreated(data) {
  const posts = await query(db, 'SELECT author_id, title FROM posts WHERE id = $1', [data.postId]);
  if (!posts.length || posts[0].author_id === data.voterId) return;

  const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
  if (milestones.includes(data.score)) {
    await createNotification(posts[0].author_id, 'milestone',
      `Your post reached ${data.score} upvotes! 🎉`, posts[0].title,
      { postId: data.postId, score: data.score });
  }
}

async function handleUserRegistered(data) {
  // Send welcome email
  await sendEmail(data.email, 'Welcome to AnonWork! 🚀',
    `<h1>Welcome, ${data.anonUsername}!</h1><p>Your anonymous professional community awaits.</p>`);
}

// ============ HTTP ENDPOINTS (for direct notification queries) ============

app.get('/api/notifications', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { page = '1', limit = '20', unread } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE user_id = $1';
    if (unread === 'true') where += ' AND read = false';
    const notifications = await query(db,
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]);
    const unreadResult = await query(db,
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false', [userId]);
    return res.json({ notifications, unreadCount: parseInt(unreadResult[0]?.count || '0') });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { notification_ids, mark_all } = req.body;
    if (mark_all) {
      await query(db, 'UPDATE notifications SET read = true WHERE user_id = $1', [userId]);
    } else if (notification_ids?.length) {
      await query(db, 'UPDATE notifications SET read = true WHERE user_id = $1 AND id = ANY($2::uuid[])', [userId, notification_ids]);
    }
    return res.json({ success: true });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// Contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await sendEmail(process.env.EMAIL_USER, `Contact: ${name}`, `<p>From: ${email}</p><p>${message}</p>`);
    return res.json({ message: 'Message sent!' });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));

// ============ START & SUBSCRIBE TO RABBITMQ ============

async function start() {
  await initDB();
  await connectRabbitMQ();

  // 🐇 Subscribe to ALL notification-related events
  await subscribe(QUEUES.IN_APP_NOTIFICATIONS, EXCHANGES.NOTIFICATIONS,
    [ROUTING_KEYS.POST_CREATED, ROUTING_KEYS.COMMENT_CREATED, ROUTING_KEYS.VOTE_CREATED],
    async (message, routingKey) => {
      switch (routingKey) {
        case ROUTING_KEYS.POST_CREATED: return handlePostCreated(message);
        case ROUTING_KEYS.COMMENT_CREATED: return handleCommentCreated(message);
        case ROUTING_KEYS.VOTE_CREATED: return handleVoteCreated(message);
      }
    });

  await subscribe(QUEUES.EMAIL_NOTIFICATIONS, EXCHANGES.EVENTS,
    [ROUTING_KEYS.USER_REGISTERED],
    async (message, routingKey) => {
      if (routingKey === ROUTING_KEYS.USER_REGISTERED) return handleUserRegistered(message);
    });

  app.listen(PORT, () => console.log(`[Notification Service] 🟢 Running on port ${PORT}`));
}
start().catch(console.error);
module.exports = app;
