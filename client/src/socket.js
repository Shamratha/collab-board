import { io } from 'socket.io-client';

let socket = null;

// Lazily create a single shared socket. Auth rides along on the httpOnly cookie
// (withCredentials), so there's no token to pass in JS. Vite proxies /socket.io
// to the API in dev.
export function getSocket() {
  if (!socket) {
    socket = io({ autoConnect: true, withCredentials: true });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
