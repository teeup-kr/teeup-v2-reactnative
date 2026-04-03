import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { authApi } from '@/lib/api/api';
import { tokenStorage } from '@/lib/tokenStorage';
import { signOutFromGoogle } from '@/lib/util/authUtils';



const AuthContext = createContext(null);
const isWeb = Platform.OS === 'web';
const GOOGLE_CALLBACK_PATH = '/auth/google/callback';

function getWebPathname() {
  if (!isWeb || typeof window === 'undefined') return '';
  return window.location.pathname;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshRunIdRef = useRef(0);

  const setAuthError = useCallback((nextError) => {
    setError(nextError);
  }, []);

  const refreshAuth = useCallback(async () => {
    const runId = ++refreshRunIdRef.current;
    setIsLoading(true);
    setAuthError(null);
    try {
      const storedUser = await tokenStorage.getUser();

      if (runId !== refreshRunIdRef.current) return null;

      if (storedUser) {
        setUser(storedUser);
      }

      if (!isWeb) {
        const [accessToken, refreshToken] = await Promise.all([
          tokenStorage.getAccessToken(),
          tokenStorage.getRefreshToken(),
        ]);

        if (!accessToken && !refreshToken) {
          if (runId !== refreshRunIdRef.current) return null;
          setUser(null);
          return null;
        }

        if (!accessToken && refreshToken) {
          await authApi.refreshToken(refreshToken);
          if (runId !== refreshRunIdRef.current) return null;
        }
      }

      const currentUser = await authApi.getCurrentUser();
      if (runId !== refreshRunIdRef.current) return null;
      if (currentUser) {
        setUser(currentUser);
        await tokenStorage.setUser(currentUser);
      }
      return currentUser ?? null;
    } catch (authError) {
      if (runId !== refreshRunIdRef.current) return null;
      setUser(null);
      setAuthError(authError);
      await tokenStorage.clearTokens();
      await tokenStorage.clearUser();
      return null;
    } finally {
      if (runId === refreshRunIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [setAuthError]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      try {
        await signOutFromGoogle();
      } catch (error) {
        console.warn('Google 로그아웃 실패:', error?.message || error);
      }
      setUser(null);
    }
    // if (isWeb) {
    //   window.location.replace('/');
    // }
  }, []);

  useEffect(() => {
    if (getWebPathname() === GOOGLE_CALLBACK_PATH) {
      setIsLoading(false);
      return;
    }
    void refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      refreshAuth,
      logout,
      setAuthError,
      setUser,
    }),
    [user, isLoading, error, refreshAuth, logout, setAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};
