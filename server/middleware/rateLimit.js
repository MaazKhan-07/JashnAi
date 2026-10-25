/**
 * Rate limiting middleware configuration.
 */
import rateLimit from 'express-rate-limit';
import config from '../config.js';

/** General API rate limit */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/** Stricter rate limit for AI endpoints */
export const aiLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.aiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait before trying again.' },
});
