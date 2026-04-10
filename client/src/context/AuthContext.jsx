import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useBroadcastAuth } from '../hooks/useBroadcastAuth';

const AuthContext = createContext(null);
const SESSION_POLL_INTERVAL = 5 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const pollTimerRef          = useRef(null);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  // Initial session check on mount
  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, []);

  // Poll every 5 min to catch server-side session expiry
  useEffect(() => {
    pollTimerRef.current = setInterval(async () => {
      if (!user) return;
      try {
        await api.get('/auth/me');
      } catch (err) {
        if (err.response?.status === 401) {
          setUser(null);
          broadcastExpiredRef.current?.();
          window.location.href = '/login?reason=session_expired';
        }
      }
    }, SESSION_POLL_INTERVAL);
    return () => clearInterval(pollTimerRef.current);
  }, [user]);

  // Re-check when user returns to this tab (catches Google logout in another tab)
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchMe().then(fresh => {
          if (!fresh) window.location.href = '/login?reason=session_expired';
        });
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [user, fetchMe]);

  // BroadcastChannel handlers
  const broadcastExpiredRef = useRef(null);

  const handleRemoteLogout = useCallback(() => {
    setUser(null);
    window.location.href = '/login?reason=logged_out_elsewhere';
  }, []);

  const handleRemoteLogin = useCallback(() => {
    fetchMe();
  }, [fetchMe]);

  const handleRemoteExpired = useCallback(() => {
    setUser(null);
    window.location.href = '/login?reason=session_expired';
  }, []);

  const { broadcastLogout, broadcastLogin, broadcastExpired } = useBroadcastAuth({
    onRemoteLogout:         handleRemoteLogout,
    onRemoteLogin:          handleRemoteLogin,
    onRemoteSessionExpired: handleRemoteExpired,
  });

  // Store broadcastExpired in ref so the interval closure can call it
  useEffect(() => { broadcastExpiredRef.current = broadcastExpired; }, [broadcastExpired]);

  // Auth actions
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    setUser(res.data.user);
    broadcastLogin();
    return res.data.user;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    broadcastLogin();
    return res.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } finally {
      setUser(null);
      broadcastLogout(); // tells all other tabs to logout immediately
    }
  };

  const completeOnboarding = async (formData) => {
    const res = await api.post('/auth/onboarding', formData);
    setUser(res.data.user);
    broadcastLogin();
    return res.data.user;
  };

  const refreshUser = async () => {
    const u = await fetchMe();
    if (u) broadcastLogin();
    return u;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      isGuest: !user,
      login,
      register,
      logout,
      completeOnboarding,
      refreshUser,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};