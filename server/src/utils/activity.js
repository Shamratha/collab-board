import { Activity } from '../models/Activity.js';
import { emitToBoard } from './emit.js';

// Record a board activity and broadcast it to everyone viewing the board.
// Best-effort: a logging failure must never break the underlying action.
export async function logActivity(req, boardId, type, text) {
  try {
    const activity = await Activity.create({
      board: boardId,
      actor: req.user._id,
      actorName: req.user.name,
      type,
      text,
    });
    emitToBoard(req, boardId, 'activity:created', { activity });
  } catch {
    // swallow — the primary write already succeeded
  }
}
