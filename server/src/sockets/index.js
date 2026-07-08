import { verifyToken } from '../utils/token.js';
import { Board } from '../models/Board.js';

export const boardRoom = (boardId) => `board:${boardId}`;

// Wire up Socket.io: authenticate every connection with the same JWT as the
// REST API, then let clients join/leave a board's room (membership-checked).
export function registerSockets(io) {
  // Handshake auth — reject sockets without a valid token.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const { userId } = verifyToken(token);
      socket.userId = userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a board room only if the user is actually a member of it.
    socket.on('board:join', async (boardId, ack) => {
      try {
        const board = await Board.findById(boardId);
        if (!board || !board.membershipOf(socket.userId)) {
          if (ack) ack({ ok: false, error: 'Not a member of this board' });
          return;
        }
        socket.join(boardRoom(boardId));
        if (ack) ack({ ok: true });
      } catch {
        if (ack) ack({ ok: false, error: 'Could not join board' });
      }
    });

    socket.on('board:leave', (boardId) => {
      socket.leave(boardRoom(boardId));
    });
  });
}
