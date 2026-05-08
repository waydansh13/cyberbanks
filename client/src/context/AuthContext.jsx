import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cb_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('cb_token', data.token);
      localStorage.setItem('cb_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed');
      throw e;
    } finally { setLoading(false); }
  };

  const register = async (name, email, password, role) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      localStorage.setItem('cb_token', data.token);
      localStorage.setItem('cb_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (e) {
      const serverErrors = e.response?.data?.errors;
      const msg = serverErrors && serverErrors.length > 0
        ? serverErrors.map(err => err.message).join(' • ')
        : e.response?.data?.message || 'Registration failed';
      setError(msg);
      throw e;
    } finally { setLoading(false); }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('cb_token');
    localStorage.removeItem('cb_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
