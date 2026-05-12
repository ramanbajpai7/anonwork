// ============================================
// API GATEWAY - Rate Limiting Middleware (Redis-backed)
// ============================================
// Uses Redis to implement a sliding window rate limiter.
// This protects all microservices from abuse without each
// service needing its own rate limiting logic.
// ============================================

const { checkRateLimit } = require('../../../shared/redis');

/**
 * Standard rate limiter: 100 requests per minute
 * Applied globally to all routes
 */
async function rateLimiter(req, res, next) {
  // Use user ID if authenticated, otherwise fall back to IP
  const identifier = req.user?.userId || req.ip || req.connection.remoteAddress;
  const key = `global:${identifier}`;

  try {
    const { allowed, remaining, resetIn } = await checkRateLimit(key, 100, 60);

    // Always set rate limit headers (API best practice)
    res.set({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetIn),
    });

    if (!allowed) {
      return res.status(429).json({
        message: 'Too many requests. Please slow down.',
        retryAfter: resetIn,
      });
    }

    next();
  } catch (error) {
    // On Redis failure, allow the request (fail open)
    console.error('[Rate Limit] Error:', error.message);
    next();
  }
}

/**
 * Strict rate limiter: 10 requests per minute
 * Applied to expensive endpoints like AI
 */
async function strictRateLimiter(req, res, next) {
  const identifier = req.user?.userId || req.ip || req.connection.remoteAddress;
  const key = `strict:${identifier}`;

  try {
    const { allowed, remaining, resetIn } = await checkRateLimit(key, 10, 60);

    res.set({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetIn),
    });

    if (!allowed) {
      return res.status(429).json({
        message: 'AI rate limit exceeded. Please wait before trying again.',
        retryAfter: resetIn,
      });
    }

    next();
  } catch (error) {
    console.error('[Rate Limit] Error:', error.message);
    next();
  }
}

module.exports = { rateLimiter, strictRateLimiter };
