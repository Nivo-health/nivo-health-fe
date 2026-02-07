// TanStack Query v5: Auth Queries
// Best practices: queryOptions factory, proper typing

import { useMutation, useQuery, queryOptions } from '@tanstack/react-query';
import { authService, LoginCredentials, LoginResponse } from '../api/auth.api';
import { queryKeys } from './queryKeys';

// ============================================
// Query Options (v5 pattern for reusability)
// ============================================

export const authQueryOptions = {
  isAuthenticated: () =>
    queryOptions({
      queryKey: queryKeys.isAuthenticated(),
      queryFn: () => authService.isAuthenticated(),
      // Auth state should be checked frequently
      staleTime: 1000 * 60, // 1 minute
    }),
};

// ============================================
// Query Hooks
// ============================================

export function useIsAuthenticated() {
  return useQuery(authQueryOptions.isAuthenticated());
}

// ============================================
// Mutation Hooks
// ============================================

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationKey: ['auth', 'login'],
    mutationFn: (credentials) => authService.login(credentials),
  });
}

export function useLogout() {
  return useMutation<void, Error, void>({
    mutationKey: ['auth', 'logout'],
    mutationFn: async () => {
      authService.logout();
    },
  });
}
