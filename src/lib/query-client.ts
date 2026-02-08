// TanStack Query v5 Client Configuration
// Best practices: proper staleTime, gcTime, error handling

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

/**
 * Custom API Error class for better error handling
 */
export class ApiError extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Create QueryClient with v5 best practices
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Log errors for debugging
        console.error('Query error:', {
          queryKey: query.queryKey,
          error: error.message,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Log mutation errors
        console.error('Mutation error:', {
          mutationKey: mutation.options.mutationKey,
          error: error.message,
        });
      },
    }),
    defaultOptions: {
      queries: {
        // v5: staleTime should be configured appropriately
        staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
        // v5: renamed from cacheTime to gcTime
        gcTime: 1000 * 60 * 60, // 1 hour - garbage collection time
        // Disable automatic refetch on window focus for better UX
        refetchOnWindowFocus: false,
        // Retry once on failure
        retry: 1,
        // v5: throwOnError for error boundary integration (optional)
        // throwOnError: false,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
}

// Singleton instance for the app
export const queryClient = createQueryClient();
