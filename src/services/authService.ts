// Auth service - Handles authentication and token management

import { apiClient } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

export const authService = {
  /**
   * Login user
   * POST /api/auth/login
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Login endpoint returns tokens directly, not wrapped in success/data
      const response = await apiClient.post<any>('/auth/login', credentials);

      // Handle both wrapped and direct response formats
      let loginData: LoginResponse;
      if (response.success && response.data) {
        loginData = response.data;
      } else if (
        response.data &&
        (response.data.access || response.data.refresh)
      ) {
        // Direct response format
        loginData = response.data;
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }

      // Store tokens in localStorage
      if (loginData.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, loginData.access);
      }
      if (loginData.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, loginData.refresh);
      }

      return loginData;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
