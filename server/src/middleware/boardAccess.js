import { Board } from '../models/Board.js';
import { ApiError } from '../utils/ApiError.js';

// Confirms the user belongs to the board and returns their membership subdoc.
// Throws 403 otherwise. Shared by the board/list/card loaders.
export function assertMembership(board, userId) {
  const membership = board.membershipOf(userId);
  if (!membership) throw new ApiError(403, 'You are not a member of this board');
  return membership;
}

// Loads the board named by :boardId, confirms the caller is a member, and
// attaches both to the request. Any board route runs this first.
export async function loadBoard(req, _res, next) {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) throw new ApiError(404, 'Board not found');

    req.board = board;
    req.membership = assertMembership(board, req.user._id);
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
