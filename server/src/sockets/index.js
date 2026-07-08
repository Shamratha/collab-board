import { verifyToken, TOKEN_COOKIE } from '../utils/token.js';
import { Board } from '../models/Board.js';

export const boardRoom = (boardId) => `board:${boardId}`;

// Pull the JWT out of the cookie header (web client) or the handshake auth
// payload (programmatic clients).
function tokenFromHandshake(socket) {
  const fromAuth = socket.handshake.auth?.token;
  if (fromAuth) return fromAuth;

  const cookieHeader = socket.handshake.headers?.cookie || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(TOKEN_COOKIE.length + 1)) : null;
}

// Wire up Socket.io: authenticate every connection with the same JWT as the
// REST API, then let clients join/leave a board's room (membership-checked).
export function registerSockets(io) {
  // Handshake auth — reject sockets without a valid token.
  io.use((socket, next) => {
    const token = tokenFromHandshake(socket);
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
