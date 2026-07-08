import { Board } from '../models/Board.js';
import { ApiError } from '../utils/ApiError.js';

// Loads the board named by :boardId, confirms the caller is a member, and
// attaches both to the request. Any board route runs this first.
export async function loadBoard(req, _res, next) {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) throw new ApiError(404, 'Board not found');

    const membership = board.membershipOf(req.user._id);
    if (!membership) throw new ApiError(403, 'You are not a member of this board');

    req.board = board;
    req.membership = membership;
    next();
  } catch (err) {
    // Malformed ObjectId → treat as not found rather than a 500.
    if (err.name === 'CastError') return next(new ApiError(404, 'Board not found'));
    next(err);
  }
}

// Guards a route so only members with the given role may proceed.
// Must run after loadBoard. Owners implicitly satisfy 'member'.
export function requireRole(role) {
  return (req, _res, next) => {
    const has = req.membership?.role;
    const ok = role === 'member' ? Boolean(has) : has === role;
    if (!ok) return next(new ApiError(403, `Requires board ${role} role`));
    next();
  };
}
