import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Brute-force protection for auth endpoints. Disabled under test so the suite
// (which logs in many times) isn't throttled.
const noop = (_req, _res, next) => next();

// Login/register: a handful of attempts per IP per window.
export const authLimiter = env.isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 20, // per IP per window
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Too many attempts, please try again later' },
    });
