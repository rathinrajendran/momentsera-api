import rateLimit from "express-rate-limit";

/**
 * Standard rate limiter tailored for strict verification, authentication,
 * and login endpoint protection.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute operational tracking window
  max: 20, // Strict limit: max 20 requests per IP address per window unit
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message:
      "Too many authentication attempts originating from this network. Please try again after 15 minutes.",
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * Highly aggressive rate limiter intended specifically to prevent
 * transactional email endpoint exploitation (e.g., email-bombing password resets).
 */
export const emailSpamLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour tracking frame
  max: 5, // Limit each IP address to 5 outbound mail dispatches per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Maximum email requests reached. Please wait an hour before requesting another link.",
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});
