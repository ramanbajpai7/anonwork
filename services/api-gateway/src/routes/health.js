// ============================================
// API GATEWAY - Health Check Route
// ============================================

const { getRedisClient } = require('../../../shared/redis');

async function healthCheck(req, res) {
  const health = {
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {},
  };

  // Check Redis connectivity
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.dependencies.redis = { status: 'connected' };
  } catch {
    health.dependencies.redis = { status: 'disconnected' };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
}

module.exports = { healthCheck };
