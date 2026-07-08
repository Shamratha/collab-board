import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { disconnectSocket } from '../socket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, ask the server who we are — the httpOnly cookie (if any) is
  // sent automatically. A 401 just means "not logged in".
  useEffect(() => {
    let active = true;
    api
      .get('/auth/me')
      .then(({ data }) => active && setUser(data.user))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user); // session cookie set by the server
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    disconnectSocket();
    try {
      await api.post('/auth/logout'); // clears the cookie server-side
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
