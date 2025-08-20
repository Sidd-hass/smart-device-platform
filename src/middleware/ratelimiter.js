import rateLimit from 'express-rate-limit';

// Per-user limiter (100 requests per minute)
export const perUserLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: (req) => {
    // Use user ID if available; otherwise fallback to IPv6-safe IP
    return req.user?.id ? `user:${req.user.id}` : rateLimit.ipKeyGenerator(req);
  },
  standardHeaders: true,
  legacyHeaders: false
});
