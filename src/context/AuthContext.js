import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authApi } from '@/lib/api/api';
import { tokenStorage } from '@/lib/tokenStorage';



const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
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
      setError(authError);
      await tokenStorage.clearTokens();
      await tokenStorage.clearUser();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logout();
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
      setUser,
    }),
    [user, isLoading, error, refreshAuth, logout],
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
