// ============================================
// USER SERVICE - Main Entry Point
// ============================================
// Handles:
//   - User registration & login
//   - JWT token generation
//   - Profile management (view, update, photo)
//   - Password changes
//   - Work email verification
//   - User search & stats
// ============================================
// NOTE: Auth VALIDATION happens at the API Gateway.
//       This service trusts X-User-Id headers from the gateway.
//       It still handles auth TOKEN GENERATION (login/register).
// ============================================

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { SignJWT, jwtVerify } = require('jose');
const { createPool, query } = require('../../shared/database');
const { publish, connect: connectRabbitMQ, EXCHANGES, ROUTING_KEYS } = require('../../shared/rabbitmq');

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 4001;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;
let db;

async function initDB() {
  db = createPool(DATABASE_URL);
  console.log('[User Service] Database pool created');
}

// JWT secret (shared with gateway for token generation)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-secret-key-change-in-production'
);

// ============================================
// HELPER: Get userId from gateway header
// ============================================
function getUserId(req) {
  return req.headers['x-user-id'];
}

// ============================================
// AUTH ROUTES
// ============================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check if user exists
    const existing = await query(db, 'SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password & generate anonymous username
    const passwordHash = await bcrypt.hash(password, 10);
    const anonUsername = `user_${Math.random().toString(16).slice(2, 6)}`;

    const newUsers = await query(db,
      `INSERT INTO users (email, password_hash, anon_username, email_verified, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, anon_username, role`,
      [email, passwordHash, anonUsername, false, 'user']
    );

    if (newUsers.length === 0) {
      return res.status(500).json({ message: 'Failed to create user' });
    }

    const user = newUsers[0];

    // Generate JWT token
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // 🐇 Publish event to RabbitMQ
    await publish(EXCHANGES.EVENTS, ROUTING_KEYS.USER_REGISTERED, {
      userId: user.id,
      email: user.email,
      anonUsername: user.anon_username,
    });

    const response = res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, anon_username: user.anon_username },
      token,
    });

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response;
  } catch (error) {
    console.error('[User Service] Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const users = await query(db, 'SELECT * FROM users WHERE email = $1', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last active
    await query(db, 'UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]);

    // Generate token
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, anon_username: user.anon_username, role: user.role },
      token,
    });
  } catch (error) {
    console.error('[User Service] Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const users = await query(db,
      `SELECT id, email, email_verified, work_email, work_email_verified,
              anon_username, display_name, role, is_verified_employee,
              verified_company_id, profile_photo_url, profile_meta,
              created_at, last_active_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: users[0] });
  } catch (error) {
    console.error('[User Service] Get me error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/auth/profile - Update profile
app.patch('/api/auth/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { display_name, anon_username } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${idx++}`);
      params.push(display_name);
    }
    if (anon_username) {
      updates.push(`anon_username = $${idx++}`);
      params.push(anon_username);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(userId);
    const result = await query(db,
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING id, email, anon_username, display_name, role`,
      params
    );

    return res.json({ user: result[0], message: 'Profile updated' });
  } catch (error) {
    console.error('[User Service] Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current and new password required' });
    }

    const users = await query(db, 'SELECT password_hash FROM users WHERE id = $1', [userId]);
    const isValid = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await query(db, 'UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[User Service] Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/search
app.get('/api/users/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ users: [] });

    const users = await query(db,
      `SELECT id, anon_username, display_name, is_verified_employee, profile_photo_url
       FROM users WHERE LOWER(anon_username) LIKE LOWER($1)
       ORDER BY is_verified_employee DESC LIMIT 20`,
      [`%${q}%`]
    );

    return res.json({ users });
  } catch (error) {
    console.error('[User Service] Search users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/stats
app.get('/api/users/stats', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const postCount = await query(db,
      "SELECT COUNT(*) as count FROM posts WHERE author_id = $1 AND status = 'active'",
      [userId]
    );
    const commentCount = await query(db,
      "SELECT COUNT(*) as count FROM comments WHERE author_id = $1 AND status = 'active'",
      [userId]
    );

    return res.json({
      stats: {
        posts: parseInt(postCount[0]?.count || '0'),
        comments: parseInt(commentCount[0]?.count || '0'),
      },
    });
  } catch (error) {
    console.error('[User Service] Stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

// ============================================
// START SERVER
// ============================================

async function start() {
  await initDB();
  await connectRabbitMQ();

  app.listen(PORT, () => {
    console.log(`[User Service] 🟢 Running on port ${PORT}`);
  });
}

start().catch(console.error);

module.exports = app;
