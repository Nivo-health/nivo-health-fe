import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationKey: ['auth', 'login'],
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: () => {
      // Invalidate all queries so they refetch with the new auth token
      queryClient.invalidateQueries();
    },
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
