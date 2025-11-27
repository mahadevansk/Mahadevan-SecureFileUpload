import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthContextType {
  userId: string | null;
  username: string | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple JWT payload parser to extract claims without adding a library
function parseJwtPayload(token: string | null): Record<string, any> | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));

  // Keep API client in sync
  React.useEffect(() => {
    import('../services/api').then((mod) => {
      mod.api.setToken(token);
    });
  }, [token]);

  const login = useCallback(async (user: string, password: string) => {
    try {
      const mod = await import('../services/api');
      const result = await mod.api.login(user, password);
      const t = result?.token;
      if (!t) return false;
      setToken(t);
      localStorage.setItem('token', t);

      // extract user id and username from token payload if present
      const payload = parseJwtPayload(t);
      const uid = payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload?.sub || null;
      const uname = payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload?.name || user;

      setUserId(uid);
      setUsername(uname);
      if (uid) localStorage.setItem('userId', uid);
      localStorage.setItem('username', uname ?? user);

      // inform API client
      mod.api.setToken(t);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const register = useCallback(async (user: string, password: string) => {
    try {
      const mod = await import('../services/api');
      const result = await mod.api.register(user, password);
      const t = result?.token;
      if (!t) return false;
      setToken(t);
      localStorage.setItem('token', t);

      const uid = result?.id ?? null;
      const uname = result?.username ?? user;

      setUserId(uid);
      setUsername(uname);
      if (uid) localStorage.setItem('userId', uid);
      localStorage.setItem('username', uname);

      mod.api.setToken(t);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    import('../services/api').then((mod) => mod.api.setToken(null));
  }, []);

  const value: AuthContextType = {
    userId,
    username,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
