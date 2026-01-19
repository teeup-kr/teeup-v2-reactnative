import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authApi } from '@/lib/api/api';
import { tokenStorage } from '@/lib/tokenStorage';



const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const setAuthError = useCallback((nextError) => {
    setError(nextError);
  }, []);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const [storedUser, accessToken] = await Promise.all([
        tokenStorage.getUser(),
        tokenStorage.getAccessToken(),
      ]);

      if (storedUser) {
        setUser(storedUser);
      }

      if (!accessToken) {
        setUser(null);
        return;
      }

      const currentUser = await authApi.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await tokenStorage.setUser(currentUser);
      }
    } catch (authError) {
      setUser(null);
      setAuthError(authError);
      await tokenStorage.clearTokens();
      await tokenStorage.clearUser();
    } finally {
      setIsLoading(false);
    }
  }, [setAuthError]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    refreshAuth();
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
