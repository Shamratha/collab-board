import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

// Verifies the Bearer JWT, loads the user, and attaches it to req.user.
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Missing or malformed Authorization header');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const user = await User.findById(payload.userId);
    if (!user) throw new ApiError(401, 'User no longer exists');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
