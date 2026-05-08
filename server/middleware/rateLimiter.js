const rateLimit = require('express-rate-limit');
const { createLog, detectThreats } = require('../utils/auditLogger');
const logger = require('../utils/logger');

// STRIDE: DoS - General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  handler: async (req, res, next, options) => {
    logger.security('Rate limit exceeded', { ip: req.ip, path: req.path });

    await createLog({
      action: 'RATE_LIMIT_HIT',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { path: req.path, limit: options.max },
      severity: 'warning',
      success: false,
    });

    await detectThreats({
      action: 'RATE_LIMIT_HIT',
      ipAddress: req.ip,
    });

    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

// STRIDE: DoS - Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  handler: async (req, res, next, options) => {
    logger.threat('Auth rate limit exceeded - possible brute force', {
      ip: req.ip,
      email: req.body?.email,
    });

    await createLog({
      action: 'RATE_LIMIT_HIT',
      email: req.body?.email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { path: req.path, type: 'AUTH_RATE_LIMIT' },
      severity: 'critical',
      success: false,
    });

    await detectThreats({
      action: 'RATE_LIMIT_HIT',
      email: req.body?.email,
      ipAddress: req.ip,
    });

    res.status(429).json(options.message);
  },
});

module.exports = { apiLimiter, authLimiter };
