import rateLimit from "express-rate-limit";

/**
 * Public endpoints (leaderboard, webhooks, auth login, etc.)
 * 120 req / 60s per IP
 */
export const limiterPublic = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin endpoints (challenge create, rules, teams)
 * 60 req / 60s per IP
 */
export const limiterAdmin = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
