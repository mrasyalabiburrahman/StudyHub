import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('studyhub_token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    authApi
      .me()
      .then((r) => setUser(r.data))
      .catch(() => {
        localStorage.removeItem('studyhub_token');
        setToken(null);
      });
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('studyhub_token', data.token);
    setToken(data.token);
    setUser(data.user);
    navigate('/');
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await authApi.register(name, email, password);
    localStorage.setItem('studyhub_token', data.token);
    setToken(data.token);
    setUser(data.user);
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('studyhub_token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return <Ctx.Provider value={{ user, token, login, register, logout }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider');
  return ctx;
}
