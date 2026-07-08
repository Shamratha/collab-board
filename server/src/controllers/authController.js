import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken, TOKEN_COOKIE } from '../utils/token.js';
import { env } from '../config/env.js';

// httpOnly cookie so the JWT is never exposed to page JavaScript (mitigates XSS
// token theft). SameSite=lax blocks cross-site sends → basic CSRF protection.
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

// The token is also returned in the body for programmatic/API clients (and the
// test suite); the web client relies solely on the httpOnly cookie.
function issueSession(res, user, status = 200) {
  const token = signToken(user._id);
  res.cookie(TOKEN_COOKIE, token, cookieOptions());
  res.status(status).json({ token, user: user.toJSON() });
}

// POST /api/auth/register  (body validated by Zod middleware)
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered');

    const user = new User({ name, email });
    await user.setPassword(password);
    await user.save();

    issueSession(res, user, 201);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login  (body validated by Zod middleware)
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // passwordHash has select:false, so ask for it explicitly here.
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    issueSession(res, user);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout — clear the session cookie.
export function logout(_req, res) {
  res.clearCookie(TOKEN_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
}

// GET /api/auth/me
export async function me(req, res) {
  res.json({ user: req.user.toJSON() });
}
