// ============================================
// MESSAGING SERVICE - Conversations & WebSocket
// ============================================
// Uses Redis for WebSocket session tracking across instances
// Uses RabbitMQ to publish message.sent events
// ============================================

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { createPool, query } = require('../../shared/database');
const { setSession, removeSession, getSession } = require('../../shared/redis');
const { publish, connect: connectRabbitMQ, EXCHANGES, ROUTING_KEYS } = require('../../shared/rabbitmq');

const app = express();
const PORT = process.env.MESSAGING_SERVICE_PORT || 4004;
app.use(express.json());

const DATABASE_URL = process.env.DATABASE_URL;
let db;
async function initDB() { db = createPool(DATABASE_URL); }
function getUserId(req) { return req.headers['x-user-id']; }

// ============ HTTP: GET CONVERSATIONS ============

app.get('/api/messages', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const conversations = await query(db,
      `SELECT c.*, cp.last_read_at,
        (SELECT json_agg(json_build_object('user_id', u.id, 'anon_username', u.anon_username, 'display_name', u.display_name, 'profile_photo_url', u.profile_photo_url))
         FROM conversation_participants cp2 JOIN users u ON u.id = cp2.user_id
         WHERE cp2.conversation_id = c.id AND cp2.user_id != $1) as other_participants
       FROM conversations c JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
       ORDER BY c.updated_at DESC`, [userId]);
    return res.json({ conversations });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ HTTP: GET MESSAGES IN CONVERSATION ============

app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const messages = await query(db,
      `SELECT m.*, u.anon_username as sender_username, u.display_name as sender_display_name
       FROM direct_messages m LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`,
      [req.params.conversationId]);
    return res.json({ messages });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ HTTP: SEND MESSAGE / START CONVERSATION ============

app.post('/api/messages', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { recipient_id, body } = req.body;
    if (!recipient_id || !body) return res.status(400).json({ message: 'Recipient and body required' });

    // Find or create conversation
    let convo = await query(db,
      `SELECT c.id FROM conversations c
       WHERE c.type = 'dm'
       AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = c.id AND user_id = $1)
       AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = c.id AND user_id = $2)`,
      [userId, recipient_id]);

    let conversationId;
    if (convo.length) {
      conversationId = convo[0].id;
    } else {
      const newConvo = await query(db, "INSERT INTO conversations (type, created_by) VALUES ('dm', $1) RETURNING id", [userId]);
      conversationId = newConvo[0].id;
      await query(db, 'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
        [conversationId, userId, recipient_id]);
    }

    const messages = await query(db,
      'INSERT INTO direct_messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, userId, body]);
    await query(db, 'UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);

    // 🐇 Publish message event
    await publish(EXCHANGES.NOTIFICATIONS, ROUTING_KEYS.MESSAGE_SENT, {
      conversationId, senderId: userId, recipientId: recipient_id, body: body.slice(0, 100),
    });

    // Broadcast to WebSocket clients
    broadcastToUser(recipient_id, { type: 'new_message', message: messages[0], conversationId });

    return res.status(201).json({ message: messages[0], conversation_id: conversationId });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'messaging-service' }));

// ============ WEBSOCKET SERVER ============
// Track connected users for real-time message delivery

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });
const userConnections = new Map(); // userId -> WebSocket

wss.on('connection', (ws, req) => {
  // Extract userId from query param (simplified; in production use JWT)
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const userId = url.searchParams.get('userId');

  if (userId) {
    userConnections.set(userId, ws);
    setSession(userId, { server: `localhost:${PORT}`, connectedAt: new Date().toISOString() });
    console.log(`[WS] User ${userId} connected`);

    ws.on('close', () => {
      userConnections.delete(userId);
      removeSession(userId);
      console.log(`[WS] User ${userId} disconnected`);
    });
  }
});

function broadcastToUser(userId, data) {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// ============ START ============

async function start() {
  await initDB();
  await connectRabbitMQ();
  server.listen(PORT, () => console.log(`[Messaging Service] 🟢 Running on port ${PORT}`));
}
start().catch(console.error);
module.exports = app;
