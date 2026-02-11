import { useMutation, useQuery, queryOptions } from '@tanstack/react-query';
import { authService, LoginCredentials, LoginResponse } from '../api/auth.api';
import { queryKeys } from './query-keys';

export const authQueryOptions = {
  isAuthenticated: () =>
    queryOptions({
      queryKey: queryKeys.isAuthenticated(),
      queryFn: () => authService.isAuthenticated(),
      // Auth state should be checked frequently
      staleTime: 1000 * 60, // 1 minute
    }),
};

export function useIsAuthenticated() {
  return useQuery(authQueryOptions.isAuthenticated());
}

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
