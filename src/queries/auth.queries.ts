import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import {
  authService,
  LoginCredentials,
  LoginResponse,
  ResetPasswordResponse,
  SetPasswordCredentials,
} from '../api/auth.api';
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
      queryClient.invalidateQueries();
    },
  });
}

export function useRestPassword() {
  return useMutation<
    ResetPasswordResponse,
    Error,
    {
      email: string;
    }
  >({
    mutationKey: ['auth', 'login'],
    mutationFn: (credentials) => authService.restPassword(credentials),
  });
}

export function useSetPassword() {
  return useMutation<ResetPasswordResponse, Error, SetPasswordCredentials>({
    mutationKey: ['auth', 'login'],
    mutationFn: (credentials) => authService.setPassword(credentials),
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
