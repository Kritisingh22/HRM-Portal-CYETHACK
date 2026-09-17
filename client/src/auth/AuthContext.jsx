/* Authentication state for the React app. Restores the session on load (refresh
 * cookie → access token → /me). Exposes login/logout and role/permission helpers.
 * Note: these helpers gate UI only — the backend independently enforces access. */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAccessToken, refresh, setOnAuthFailure } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // If a refresh fails mid-session, the API layer calls this: clear all auth state
  // so the route guards send the user to /login (session-expiry handling).
  useEffect(() => {
    setOnAuthFailure(() => { setAccessToken(null); setUser(null); });
    return () => setOnAuthFailure(null);
  }, []);

  // restore an existing session on first load
  useEffect(() => {
    (async () => {
      if (await refresh()) {
        try { const { user } = await api.me(); setUser(user); } catch { /* not logged in */ }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { accessToken, user } = await api.login(email, password);
    setAccessToken(accessToken);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.includes(user.role), [user]);
  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    const p = user.permissions || [];
    return p.includes('*') || p.includes(perm) || p.includes(perm.split(':')[0] + ':*');
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
