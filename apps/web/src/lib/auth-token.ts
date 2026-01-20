/**
 * In-memory token storage for access tokens.
 * Access tokens are short-lived and stored in memory only.
 * Refresh tokens are stored in HTTP-only cookies by the server.
 */

let accessToken: string | null = null;

export function getAccessToken(): string | null {
	return accessToken;
}

export function setAccessToken(token: string | null): void {
	accessToken = token;
}

export function clearAccessToken(): void {
	accessToken = null;
}

export function isAuthenticated(): boolean {
	return accessToken !== null;
}
