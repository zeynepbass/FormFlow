import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const MINUTE = 60 * 1000;

function limiter({ windowMs, limit, keyGenerator, message }) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: message ?? 'Çok fazla istek gönderildi. Biraz bekleyip tekrar dene.',
        },
      });
    },
  });
}

const ipKey = (req) => ipKeyGenerator(req.ip);

const emailKey = (req) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `email:${email}`;
};

export function createRateLimiters() {
  return {
    api: limiter({ windowMs: 15 * MINUTE, limit: 1000, keyGenerator: ipKey }),
    loginByIp: limiter({
      windowMs: 15 * MINUTE,
      limit: 10,
      keyGenerator: ipKey,
      message: 'Çok fazla giriş denemesi yapıldı. Birkaç dakika sonra tekrar dene.',
    }),
    loginByEmail: limiter({
      windowMs: 15 * MINUTE,
      limit: 5,
      keyGenerator: emailKey,
      message: 'Çok fazla giriş denemesi yapıldı. Birkaç dakika sonra tekrar dene.',
    }),
    register: limiter({ windowMs: 60 * MINUTE, limit: 5, keyGenerator: ipKey }),
    passwordReset: limiter({ windowMs: 60 * MINUTE, limit: 5, keyGenerator: ipKey }),
    submitPerForm: limiter({
      windowMs: MINUTE,
      limit: 10,
      keyGenerator: (req) => `${ipKey(req)}:${req.params.slug}`,
      message: 'Çok fazla gönderim yapıldı. Bir dakika bekleyip tekrar dene.',
    }),
    submitPerIp: limiter({ windowMs: 60 * MINUTE, limit: 100, keyGenerator: ipKey }),
    events: limiter({ windowMs: MINUTE, limit: 60, keyGenerator: ipKey }),
  };
}
