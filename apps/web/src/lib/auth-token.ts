/**
 * In-memory token storage for access tokens.
 * Access tokens are short-lived and stored in memory only.
 * Refresh tokens are stored in HTTP-only cookies by the server.
 */

let accessToken: string | null = null;
let tokenChangeListeners: Array<() => void> = [];

export function getAccessToken(): string | null {
	return accessToken;
}

export function setAccessToken(token: string | null): void {
	accessToken = token;
	// Notify listeners of token change
	for (const listener of tokenChangeListeners) {
		listener();
	}
}

export function clearAccessToken(): void {
	accessToken = null;
	for (const listener of tokenChangeListeners) {
		listener();
	}
}

export function onTokenChange(listener: () => void): () => void {
	tokenChangeListeners.push(listener);
	return () => {
		tokenChangeListeners = tokenChangeListeners.filter((l) => l !== listener);
	};
}

export function isAuthenticated(): boolean {
	return accessToken !== null;
}
