import { boardRoom } from '../sockets/index.js';

// Broadcast a change to everyone viewing a board. Called by controllers AFTER a
// successful DB write ("commit then broadcast"), so sockets only ever carry
// notifications of committed state. Emitting to the whole room (including the
// originator) lets every client converge on server truth idempotently.
export function emitToBoard(req, boardId, event, payload) {
  const io = req.app.get('io');
  if (!io) return;
  io.to(boardRoom(boardId)).emit(event, payload);
}
