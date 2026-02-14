// Auth service - Handles authentication and token management
// TanStack Query v5 best practices

import { post } from './client';
import { ApiError } from '@/lib/query-client';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../lib/auth-tokens';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SetPasswordCredentials {
  token: string;
  new_password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: true;
}

export const authService = {
  /**
   * Login user
   * POST /api/auth/login
   * @throws {ApiError} When login fails
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await post<LoginResponse>('/auth/login', credentials);

    // Handle both wrapped and direct response formats
    let loginData: LoginResponse;
    if (response.success && response.data) {
      loginData = response.data;
    } else if (
      response.data &&
      (response.data.access || response.data.refresh)
    ) {
      loginData = response.data;
    } else {
      // v5 best practice: throw proper Error objects
      const errorMessage = response.error?.message || 'Login failed';
      throw new ApiError(
        errorMessage,
        response.error?.code || 'AUTH_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    // Store tokens in localStorage
    setTokens(loginData.access, loginData.refresh);

    return loginData;
  },

  async restPassword(credentials: {
    email: string;
  }): Promise<ResetPasswordResponse> {
    const response = await post<ResetPasswordResponse>(
      '/auth/password-reset/request',
      credentials,
    );

    let resetMessage: ResetPasswordResponse;
    if (response.success && response.data) {
      resetMessage = response.data;
    } else if (
      response.data &&
      (response.data.success || response.data.message)
    ) {
      resetMessage = response.data;
    } else {
      const errorMessage = response.error?.message || 'Failed to send mail';
      throw new ApiError(
        errorMessage,
        response.error?.code || 'AUTH_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    return resetMessage;
  },

  async setPassword(
    credentials: SetPasswordCredentials,
  ): Promise<ResetPasswordResponse> {
    const response = await post<ResetPasswordResponse>(
      '/auth/password-reset/confirm',
      credentials,
    );

    let resetMessage: ResetPasswordResponse;
    if (response.success && response.data) {
      resetMessage = response.data;
    } else if (
      response.data &&
      (response.data.success || response.data.message)
    ) {
      resetMessage = response.data;
    } else {
      const errorMessage = response.error?.message || 'Failed to set password';
      throw new ApiError(
        errorMessage,
        response.error?.code || 'AUTH_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    return resetMessage;
  },

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return getAccessToken();
  },

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return getRefreshToken();
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
    clearTokens();
  },
};
