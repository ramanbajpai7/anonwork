// ============================================
// API GATEWAY - JWT Authentication Middleware
// ============================================
// This middleware validates JWT tokens at the gateway level,
// so individual microservices don't need to handle auth.
// The user info is forwarded via X-User-Id headers.
// ============================================

const { jwtVerify } = require('jose');

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-secret-key-change-in-production'
);

/**
 * Required authentication middleware
 * Returns 401 if no valid token is found
 */
async function authenticateToken(req, res, next) {
  try {
    // Check for token in: 1) Cookie, 2) Authorization header
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required',
        hint: 'Include a valid JWT in the auth_token cookie or Authorization header.',
      });
    }

    // Verify the JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Attach user info to request for downstream services
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    // Set headers for proxy forwarding
    req.headers['x-user-id'] = payload.userId;
    req.headers['x-user-email'] = payload.email || '';

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(401).json({
      message: 'Invalid or expired token',
      hint: 'Please log in again to get a new token.',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't block if not
 */
async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
      req.headers['x-user-id'] = payload.userId;
      req.headers['x-user-email'] = payload.email || '';
    }
  } catch {
    // Token invalid, continue without user info
  }

  next();
}

module.exports = { authenticateToken, optionalAuth };
