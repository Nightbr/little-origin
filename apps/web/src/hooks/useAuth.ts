import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { ME_QUERY, LOGIN_MUTATION, REGISTER_MUTATION } from '../graphql/operations';
import { useState, useEffect } from 'react';

export function useAuth() {
  const { data, loading, error, refetch } = useQuery(ME_QUERY);
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const client = useApolloClient();

  const login = async (username: string, password: string) => {
    const res = await loginMutation({ variables: { username, password } });
    const { token } = res.data.login;
    localStorage.setItem('token', token);
    await client.resetStore();
    window.location.reload(); // Force WS reconnection
  };

  const register = async (username: string, password: string) => {
    const res = await registerMutation({ variables: { username, password } });
    const { token } = res.data.register;
    localStorage.setItem('token', token);
    await client.resetStore();
    window.location.reload(); // Force WS reconnection
  };

  const logout = async () => {
    localStorage.removeItem('token');
    await client.resetStore();
    window.location.reload(); // Clear all state
  };

  return {
    user: data?.me,
    isAuthenticated: !!data?.me,
    loading,
    error,
    login,
    register,
    logout,
  };
}
