// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

function make({ windowMs, max, devMax, message }) {
  return rateLimit({
    windowMs,
    max: isDev ? (devMax ?? max * 10) : max,   // 10x limit in development
    standardHeaders: true,
    legacyHeaders: false,
    skip: req => req.path === '/events',
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: isDev
          ? `[Dev] Rate limit hit. Restart server to reset. (${message})`
          : message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
}

// Auth: 10 attempts / 15 min in production, 100 in dev
const authLimiter = make({
  windowMs: 15 * 60 * 1000, max: 10, devMax: 100,
  message: 'Too many login attempts. Please wait 15 minutes.',
});

// Orders: 30 req / min
const orderLimiter = make({
  windowMs: 60 * 1000, max: 30,
  message: 'Too many order requests. Please slow down.',
});

// Payments: 10 req / 5 min (prevent double-submit)
const paymentLimiter = make({
  windowMs: 5 * 60 * 1000, max: 10,
  message: 'Too many payment requests. Please wait.',
});

// General: 300 req / min
const generalLimiter = make({
  windowMs: 60 * 1000, max: 300,
  message: 'Too many requests. Please slow down.',
});

module.exports = { authLimiter, orderLimiter, paymentLimiter, generalLimiter };
