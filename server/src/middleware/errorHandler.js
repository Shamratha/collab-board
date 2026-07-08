import { ApiError } from '../utils/ApiError.js';

// 404 for unmatched routes.
export function notFound(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler — must have 4 args for Express to treat it as such.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Mongo duplicate key (e.g. email already registered).
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  // Mongoose validation error.
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    return res.status(400).json({ error: message });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
