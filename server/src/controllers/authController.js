import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      throw new ApiError(400, 'name, email and password are required');
    }
    if (String(password).length < 6) {
      throw new ApiError(400, 'password must be at least 6 characters');
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) throw new ApiError(409, 'Email already registered');

    const user = new User({ name, email });
    await user.setPassword(password);
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      throw new ApiError(400, 'email and password are required');
    }

    // passwordHash has select:false, so ask for it explicitly here.
    const user = await User.findOne({
      email: String(email).toLowerCase(),
    }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
export async function me(req, res) {
  res.json({ user: req.user.toJSON() });
}
