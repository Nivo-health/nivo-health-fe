// API Client - Production-ready HTTP client
// All requests go directly to the real API

import { ApiError } from '@/lib/query-client';

// Re-export ApiError for consumers that import from client.ts
export { ApiError } from '@/lib/query-client';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
    details?: Record<string, string[]>;
  };
}

const baseURL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.nivohealth.in/api';

let refreshPromise: Promise<string | null> | null = null;

function buildURL(
  endpoint: string,
  params?: Record<string, string | number>,
): string {
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`,
  );
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
}

function getAuthHeader(): string | null {
  const token = localStorage.getItem('auth_access_token');
  return token ? `Bearer ${token}` : null;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (!refreshToken) return null;

    try {
      const refreshEndpoint =
        import.meta.env.VITE_API_REFRESH_ENDPOINT || '/auth/refresh';
      const url = buildURL(refreshEndpoint);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const result = (await parseResponse(response)) as {
        access?: string;
        refresh?: string;
        token?: string;
        data?: { access?: string; refresh?: string };
      } | null;
      const access =
        result?.access || result?.data?.access || result?.token || null;
      const refresh = result?.refresh || result?.data?.refresh || refreshToken;

      if (access) {
        localStorage.setItem('auth_access_token', access);
      }
      if (refresh) {
        localStorage.setItem('auth_refresh_token', refresh);
      }

      return access;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(text);
  }

  // Try parsing as JSON even without proper content-type
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(
      `Expected JSON response but got ${contentType || 'unknown'}`,
      'INVALID_RESPONSE',
      response.status,
    );
  }
}

function normalizeResponse<T>(result: unknown): ApiResponse<T> {
  // Case 1: { success: true, data: T }
  if (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    'data' in result
  ) {
    const r = result as { success: boolean; data: T; message?: string };
    return {
      success: r.success,
      data: r.data,
      message: r.message,
    };
  }

  // Case 2: Direct array
  if (Array.isArray(result)) {
    return {
      success: true,
      data: result as T,
    };
  }

  // Case 3: { data: T } without success field
  if (
    typeof result === 'object' &&
    result !== null &&
    'data' in result &&
    !('success' in result)
  ) {
    return {
      success: true,
      data: (result as { data: T }).data,
    };
  }

  // Case 4: Auth tokens { access, refresh }
  if (
    typeof result === 'object' &&
    result !== null &&
    ('access' in result || 'refresh' in result)
  ) {
    return {
      success: true,
      data: result as T,
    };
  }

  // Case 5: Paginated { results: T[], count, next, previous }
  if (
    typeof result === 'object' &&
    result !== null &&
    'results' in result &&
    Array.isArray((result as { results: unknown[] }).results)
  ) {
    return {
      success: true,
      data: result as T,
    };
  }

  // Default: wrap object as data
  return {
    success: true,
    data: result as T,
  };
}

async function request<T>(
  method: string,
  endpoint: string,
  data?: unknown,
  params?: Record<string, string | number>,
  isRetry = false,
): Promise<ApiResponse<T>> {
  try {
    const url = buildURL(endpoint, params);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const authHeader = getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return { success: true, data: undefined as T };
    }

    let result: unknown;
    try {
      result = await parseResponse(response);
    } catch (error) {
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: `Server returned ${response.status} ${response.statusText}`,
            statusCode: response.status,
          },
        };
      }
      throw error;
    }

    if (!response.ok) {
      // Check for 401 and try token refresh
      const isUnauthorized =
        response.status === 401 ||
        (typeof result === 'object' &&
          result !== null &&
          (('error' in result &&
            typeof (result as { error: { code?: string } }).error ===
              'object' &&
            (result as { error: { code?: string } }).error?.code ===
              'UNAUTHORIZED') ||
            ('code' in result &&
              (result as { code: string }).code === 'UNAUTHORIZED')));

      if (isUnauthorized && !isRetry) {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
          return request<T>(method, endpoint, data, params, true);
        }
      }

      // Extract error from response
      const errorResult = result as {
        error?: {
          code?: string;
          message?: string;
          details?: Record<string, string[]>;
        };
        message?: string;
        details?: Record<string, string[]>;
      };

      return {
        success: false,
        error: {
          code: errorResult.error?.code || 'HTTP_ERROR',
          message:
            errorResult.error?.message ||
            errorResult.message ||
            `HTTP ${response.status}`,
          statusCode: response.status,
          details: errorResult.error?.details || errorResult.details,
        },
      };
    }

    return normalizeResponse<T>(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message,
        statusCode: 0,
      },
    };
  }
}

export async function get<T>(
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<ApiResponse<T>> {
  return request<T>('GET', endpoint, undefined, params);
}

export async function post<T>(
  endpoint: string,
  data?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>('POST', endpoint, data);
}

export async function put<T>(
  endpoint: string,
  data?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>('PUT', endpoint, data);
}

export async function patch<T>(
  endpoint: string,
  data?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>('PATCH', endpoint, data);
}

export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return request<T>('DELETE', endpoint);
}
