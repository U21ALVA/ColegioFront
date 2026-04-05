// Token storage utilities
// Using localStorage for simplicity - in production consider httpOnly cookies

const ACCESS_TOKEN_KEY = 'crp_access_token';
const REFRESH_TOKEN_KEY = 'crp_refresh_token';
const USER_KEY = 'crp_user';

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  rol: string;
  nombres?: string;
  apellidos?: string;
}

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

export function getAccessToken(): string | null {
  if (!isClient) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isClient) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isClient) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (!isClient) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (!isClient) return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  if (!isClient) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Parse JWT to get expiration (without validation - that's server's job)
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

// Get role from stored user
export function getUserRole(): string | null {
  const user = getStoredUser();
  return user?.rol || null;
}

// Check if user has specific role
export function hasRole(role: string): boolean {
  const userRole = getUserRole();
  return userRole === role;
}

// Check if user has any of the specified roles
export function hasAnyRole(roles: string[]): boolean {
  const userRole = getUserRole();
  return userRole ? roles.includes(userRole) : false;
}
