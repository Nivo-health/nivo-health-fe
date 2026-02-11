const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string | null, refresh: string | null) {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
