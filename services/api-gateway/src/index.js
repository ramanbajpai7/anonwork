// ============================================
// API GATEWAY - Main Entry Point
// ============================================
// This is the SINGLE entry point for ALL client requests.
// It handles:
//   1. CORS & Security Headers
//   2. Rate Limiting (via Redis)
//   3. JWT Authentication Validation
//   4. Request Routing (proxying to microservices)
//   5. Logging
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

const { authenticateToken, optionalAuth } = require('./middleware/auth');
const { rateLimiter, strictRateLimiter } = require('./middleware/rateLimiter');
const { healthCheck } = require('./routes/health');

const app = express();
const PORT = process.env.GATEWAY_PORT || 4000;

// ============================================
// 1. GLOBAL MIDDLEWARE
// ============================================

// Security headers (OWASP best practices)
app.use(helmet());

// CORS - Allow frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse cookies (for JWT in httpOnly cookies)
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use(morgan(':method :url :status :response-time ms - :remote-addr'));

// Global rate limiter (100 requests per minute per IP)
app.use(rateLimiter);

// ============================================
// 2. HEALTH CHECK (no auth needed)
// ============================================

app.get('/health', healthCheck);

// ============================================
// 3. SERVICE URLs (from environment or defaults)
// ============================================

const SERVICES = {
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:4001',
  CONTENT_SERVICE: process.env.CONTENT_SERVICE_URL || 'http://localhost:4002',
  NOTIFICATION_SERVICE: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4003',
  MESSAGING_SERVICE: process.env.MESSAGING_SERVICE_URL || 'http://localhost:4004',
  AI_SERVICE: process.env.AI_SERVICE_URL || 'http://localhost:4005',
};

// ============================================
// 4. PROXY CONFIGURATION
// ============================================

// Helper to create proxy config
function proxyTo(targetUrl, pathRewrite = {}) {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite,
    // Forward auth headers
    onProxyReq: (proxyReq, req) => {
      // Forward user info from JWT validation
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.userId);
        proxyReq.setHeader('X-User-Email', req.user.email || '');
      }
      // Forward cookies
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
    },
    onError: (err, req, res) => {
      console.error(`[Gateway] Proxy error for ${req.url}:`, err.message);
      res.status(502).json({
        message: 'Service temporarily unavailable',
        service: req.url.split('/')[2], // e.g., "auth" from "/api/auth/..."
      });
    },
  });
}

// ============================================
// 5. ROUTE DEFINITIONS
// ============================================

// --- AUTH ROUTES (User Service) ---
// Public: login, register (no auth required)
app.use('/api/auth/login', proxyTo(SERVICES.USER_SERVICE));
app.use('/api/auth/register', proxyTo(SERVICES.USER_SERVICE));

// Protected: profile, me, change-password, etc.
app.use('/api/auth', authenticateToken, proxyTo(SERVICES.USER_SERVICE));

// --- USER ROUTES (User Service) ---
app.use('/api/users', optionalAuth, proxyTo(SERVICES.USER_SERVICE));

// --- CONTENT ROUTES (Content Service) ---
// Public: reading posts, companies, reviews, salaries, topics, search
app.get('/api/posts', optionalAuth, proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/posts/:id', optionalAuth, proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/posts/:id/comments', optionalAuth, proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/companies', proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/companies/:id', proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/reviews', proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/salaries', proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/topics', proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/topics/:slug', proxyTo(SERVICES.CONTENT_SERVICE));
app.get('/api/search', proxyTo(SERVICES.CONTENT_SERVICE));

// Protected: creating posts, comments, votes, reviews, salaries, bookmarks
app.post('/api/posts', authenticateToken, proxyTo(SERVICES.CONTENT_SERVICE));
app.post('/api/posts/:id/comments', authenticateToken, proxyTo(SERVICES.CONTENT_SERVICE));
app.post('/api/posts/:id/vote', authenticateToken, proxyTo(SERVICES.CONTENT_SERVICE));
app.post('/api/reviews', authenticateToken, proxyTo(SERVICES.CONTENT_SERVICE));
app.post('/api/salaries', authenticateToken, proxyTo(SERVICES.CONTENT_SERVICE));
app.use('/api/bookmarks', authenticateToken, proxyTo(SERVICES.CONTENT_SERVICE));

// Admin routes
app.use('/api/admin', authenticateToken, proxyTo(SERVICES.CONTENT_SERVICE));

// --- MESSAGING ROUTES (Messaging Service) ---
app.use('/api/messages', authenticateToken, proxyTo(SERVICES.MESSAGING_SERVICE));
app.use('/api/channels', authenticateToken, proxyTo(SERVICES.MESSAGING_SERVICE));

// --- NOTIFICATION ROUTES (Notification Service) ---
app.use('/api/notifications', authenticateToken, proxyTo(SERVICES.NOTIFICATION_SERVICE));

// --- AI ROUTES (AI Service) ---
// Stricter rate limit for AI endpoints (10 requests per minute)
app.use('/api/ai', authenticateToken, strictRateLimiter, proxyTo(SERVICES.AI_SERVICE));

// --- CONTACT ROUTE (can go to notification service for email) ---
app.use('/api/contact', proxyTo(SERVICES.NOTIFICATION_SERVICE));

// ============================================
// 6. ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    hint: 'Check the API documentation for available endpoints.',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Gateway] Unhandled error:', err);
  res.status(500).json({
    message: 'Internal gateway error',
  });
});

// ============================================
// 7. START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('  🚀 AnonWork API Gateway');
  console.log(`  📡 Listening on port ${PORT}`);
  console.log('  🔗 Service Registry:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`     ${name}: ${url}`);
  });
  console.log('='.repeat(60));
  console.log('');
});

module.exports = app;
