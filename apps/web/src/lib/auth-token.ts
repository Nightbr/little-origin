/**
 * In-memory token storage for access tokens.
 * Access tokens are short-lived and stored in memory only.
 * Refresh tokens are stored in HTTP-only cookies by the server.
 */

let accessToken: string | null = null;
let tokenExpirationTime: number | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

// Time before expiration to trigger refresh (1 minute)
const REFRESH_BUFFER_MS = 60 * 1000;

// Callback for token refresh
let refreshCallback: (() => Promise<void>) | null = null;

/**
 * Parse JWT to extract expiration time
 */
function parseJwtExpiration(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000; // Convert to milliseconds
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Schedule token refresh before expiration
 */
function scheduleTokenRefresh(): void {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  if (!tokenExpirationTime || !refreshCallback) return;

  const now = Date.now();
  const timeUntilRefresh = tokenExpirationTime - now - REFRESH_BUFFER_MS;

  if (timeUntilRefresh <= 0) {
    // Token is about to expire or already expired, refresh immediately
    refreshCallback().catch(() => {
      // Refresh failed, will be handled by 403 logic
    });
    return;
  }

  // Schedule refresh before expiration
  refreshTimer = setTimeout(() => {
    if (refreshCallback) {
      refreshCallback().catch(() => {
        // Refresh failed, will be handled by 403 logic
      });
    }
  }, timeUntilRefresh);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getTokenExpirationTime(): number | null {
  return tokenExpirationTime;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  tokenExpirationTime = token ? parseJwtExpiration(token) : null;

  // Schedule refresh for new token
  if (token) {
    scheduleTokenRefresh();
  }
}

export function clearAccessToken(): void {
  accessToken = null;
  tokenExpirationTime = null;

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export function isAuthenticated(): boolean {
  return accessToken !== null;
}

/**
 * Set the callback function to be called when token needs refreshing
 */
export function setRefreshCallback(callback: () => Promise<void>): void {
  refreshCallback = callback;
  // If we already have a token, schedule refresh
  if (accessToken) {
    scheduleTokenRefresh();
  }
}

/**
 * Check if the token is expired or about to expire
 */
export function isTokenExpiredOrExpiring(): boolean {
  if (!tokenExpirationTime) return true;
  return Date.now() >= tokenExpirationTime - REFRESH_BUFFER_MS;
}
