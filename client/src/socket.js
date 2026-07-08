import { io } from 'socket.io-client';
import { getToken } from './api/client.js';

let socket = null;

// Lazily create a single shared socket, authenticated with the current JWT.
// Connects to the same origin; Vite proxies /socket.io to the API in dev.
export function getSocket() {
  if (!socket) {
    socket = io({
      autoConnect: true,
      auth: { token: getToken() },
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
