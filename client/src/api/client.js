import axios from 'axios';

// Auth is carried by an httpOnly cookie the browser attaches automatically, so
// the token is never readable from JS. `withCredentials` sends that cookie.
export const api = axios.create({ baseURL: '/api', withCredentials: true });

// Normalize server errors: expose `err.message`, plus `err.status` and
// `err.data` so callers can react to specific cases (e.g. a 409 conflict that
// carries the current server card).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const res = err.response;
    const error = new Error(res?.data?.error || err.message || 'Something went wrong');
    error.status = res?.status;
    error.data = res?.data;
    return Promise.reject(error);
  }
);
