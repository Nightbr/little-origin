import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import { LOGIN_MUTATION, LOGOUT_MUTATION, ME_QUERY, REFRESH_TOKEN_MUTATION } from '../graphql/operations';
import { attemptTokenRefresh, resetAuthErrorCounter } from '../lib/apollo-client';
import { isAuthenticated as checkIsAuthenticated, clearAccessToken, setAccessToken, setRefreshCallback } from '../lib/auth-token';

interface User {
  id: string;
  username: string;
}

export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    data,
    loading: meLoading,
    refetch,
  } = useQuery(ME_QUERY, {
    skip: !checkIsAuthenticated(), // Only run if we have a token
    fetchPolicy: 'network-only',
  });

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);
  const client = useApolloClient();

  // Set up proactive token refresh callback
  useEffect(() => {
    setRefreshCallback(async () => {
      const newToken = await attemptTokenRefresh();
      if (!newToken) {
        // Refresh failed, clear token (user will need to re-login)
        clearAccessToken();
      }
    });
  }, []);

  // Try to refresh token on app start
  const initializeAuth = useCallback(async () => {
    try {
      const result = await refreshTokenMutation();
      const { accessToken } = result.data.refreshToken;
      setAccessToken(accessToken);
      resetAuthErrorCounter();
      await refetch();
    } catch {
      // No valid refresh token, user needs to log in
      clearAccessToken();
    } finally {
      setIsInitialized(true);
    }
  }, [refreshTokenMutation, refetch]);

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  const login = async (username: string, password: string) => {
    const res = await loginMutation({ variables: { username, password } });
    const { accessToken } = res.data.login;
    setAccessToken(accessToken);
    resetAuthErrorCounter();
    await client.resetStore();
    window.location.reload(); // Force WS reconnection with new token
  };

  const logout = async () => {
    try {
      await logoutMutation(); // Clear refresh token cookie
    } catch {
      // Ignore errors during logout
    }
    clearAccessToken();
    await client.resetStore();
    window.location.href = '/login';
  };

  const user: User | null = data?.me ?? null;
  const isAuthenticated = checkIsAuthenticated() && !!user;
  const loading = !isInitialized || meLoading;

  return {
    user,
    isAuthenticated,
    loading,
    isInitialized,
    login,
    logout,
    refreshToken: initializeAuth,
  };
}
