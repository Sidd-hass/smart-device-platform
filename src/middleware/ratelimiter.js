import rateLimit from "express-rate-limit";

// Determine environment
const isDev = process.env.NODE_ENV !== "production";

// -------------------- Auth endpoints limiter -------------------- //
// Limit login/signup attempts to prevent brute force
export const authLimiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
  max: isDev ? 3 : 10, // 3 requests per min in dev, 10 per 15 min in prod
  message: {
    success: false,
    message: "Too many login/signup attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// -------------------- Device/user endpoints limiter -------------------- //
// Looser limits for authenticated routes
export const perUserLimiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : 60 * 1000, // 1 min dev, 1 min prod
  max: isDev ? 10 : 100, // 10 reqs/min dev, 100 reqs/min prod
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
