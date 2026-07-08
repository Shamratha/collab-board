import axios from 'axios';

const TOKEN_KEY = 'collabboard.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({ baseURL: '/api' });

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
