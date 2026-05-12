// ============================================
// SHARED: Redis Connection Helper
// Used for caching and rate limiting across all services
// ============================================

const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient = null;

/**
 * Get or create a Redis connection
 */
function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Reconnect strategy
      retryStrategy(times) {
        if (times > 10) {
          console.error('[Redis] Max reconnection attempts reached');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 5000);
        console.log(`[Redis] Reconnecting in ${delay}ms...`);
        return delay;
      },
    });

    redisClient.on('connect', () => console.log('[Redis] Connected'));
    redisClient.on('error', (err) => console.error('[Redis] Error:', err.message));
    redisClient.on('close', () => console.log('[Redis] Connection closed'));
  }

  return redisClient;
}

// ============================================
// CACHING HELPERS
// ============================================

/**
 * Get a cached value. Returns null if cache miss.
 * @param {string} key - Cache key
 * @returns {Promise<any|null>}
 */
async function getCache(key) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    if (value) {
      console.log(`[Redis Cache] HIT: ${key}`);
      return JSON.parse(value);
    }
    console.log(`[Redis Cache] MISS: ${key}`);
    return null;
  } catch (error) {
    console.error('[Redis Cache] Get error:', error.message);
    return null;
  }
}

/**
 * Set a cached value with TTL (time-to-live in seconds)
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
async function setCache(key, value, ttl = 300) {
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(value));
    console.log(`[Redis Cache] SET: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('[Redis Cache] Set error:', error.message);
  }
}

/**
 * Invalidate (delete) a cached key
 * @param {string} key - Cache key to delete
 */
async function invalidateCache(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
    console.log(`[Redis Cache] INVALIDATED: ${key}`);
  } catch (error) {
    console.error('[Redis Cache] Invalidate error:', error.message);
  }
}

/**
 * Invalidate all keys matching a pattern (e.g., "posts:*")
 * @param {string} pattern - Pattern to match
 */
async function invalidateCachePattern(pattern) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
      console.log(`[Redis Cache] INVALIDATED ${keys.length} keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('[Redis Cache] Pattern invalidate error:', error.message);
  }
}

// ============================================
// RATE LIMITING HELPERS
// ============================================

/**
 * Check and increment rate limit for a given key
 * Uses a sliding window counter algorithm
 * 
 * @param {string} identifier - User ID or IP address
 * @param {number} maxRequests - Maximum requests allowed in the window
 * @param {number} windowSeconds - Time window in seconds
 * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
 */
async function checkRateLimit(identifier, maxRequests = 100, windowSeconds = 60) {
  try {
    const client = getRedisClient();
    const key = `ratelimit:${identifier}`;

    // Increment the counter
    const current = await client.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await client.expire(key, windowSeconds);
    }

    // Get time remaining
    const ttl = await client.ttl(key);

    const allowed = current <= maxRequests;
    const remaining = Math.max(0, maxRequests - current);

    if (!allowed) {
      console.log(`[Rate Limit] BLOCKED: ${identifier} (${current}/${maxRequests})`);
    }

    return { allowed, remaining, resetIn: ttl };
  } catch (error) {
    console.error('[Redis Rate Limit] Error:', error.message);
    // On error, allow the request (fail open)
    return { allowed: true, remaining: maxRequests, resetIn: windowSeconds };
  }
}

// ============================================
// SESSION HELPERS (for WebSocket tracking)
// ============================================

/**
 * Store an active WebSocket session
 */
async function setSession(userId, sessionData) {
  try {
    const client = getRedisClient();
    await client.hset('active_sessions', userId, JSON.stringify(sessionData));
  } catch (error) {
    console.error('[Redis Session] Set error:', error.message);
  }
}

/**
 * Get an active session
 */
async function getSession(userId) {
  try {
    const client = getRedisClient();
    const data = await client.hget('active_sessions', userId);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Redis Session] Get error:', error.message);
    return null;
  }
}

/**
 * Remove a session
 */
async function removeSession(userId) {
  try {
    const client = getRedisClient();
    await client.hdel('active_sessions', userId);
  } catch (error) {
    console.error('[Redis Session] Remove error:', error.message);
  }
}

/**
 * Close Redis connection
 */
async function close() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Connection closed gracefully');
  }
}

module.exports = {
  getRedisClient,
  getCache,
  setCache,
  invalidateCache,
  invalidateCachePattern,
  checkRateLimit,
  setSession,
  getSession,
  removeSession,
  close,
};
