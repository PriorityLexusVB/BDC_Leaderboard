import rateLimit from 'express-rate-limit';

export const limiterPublic = rateLimit({
  windowMs: 60_000, // 1 min
  max: 120,         // 120 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});

export const limiterAdmin = rateLimit({
  windowMs: 60_000,
  max: 60,          // admin routes slower
  standardHeaders: true,
  legacyHeaders: false,
});
