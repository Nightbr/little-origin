import {
	ApolloClient,
	type FetchResult,
	HttpLink,
	InMemoryCache,
	Observable,
	from,
	split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { clearAccessToken, getAccessToken, setAccessToken } from './auth-token';

// Use relative URL - works with any domain/port since API serves the frontend
const API_URL = '/graphql';
// Dynamically construct WebSocket URL based on current location
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/graphql`;

// Track if we're currently refreshing to avoid multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const httpLink = new HttpLink({
	uri: API_URL,
	credentials: 'include', // Include cookies for refresh token
});

const authLink = setContext((_, { headers }) => {
	const token = getAccessToken();
	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : '',
		},
	};
});

/**
 * Attempt to refresh the access token
 * Returns the new access token or null if refresh failed
 */
async function attemptTokenRefresh(): Promise<string | null> {
	// If already refreshing, wait for that to complete
	if (isRefreshing && refreshPromise) {
		return refreshPromise;
	}

	isRefreshing = true;
	refreshPromise = (async () => {
		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include', // Include cookies for refresh token
				body: JSON.stringify({
					query: 'mutation RefreshToken { refreshToken { accessToken } }',
				}),
			});

			if (!response.ok) {
				return null;
			}

			const data = await response.json();
			if (data.data?.refreshToken?.accessToken) {
				const newToken = data.data.refreshToken.accessToken;
				setAccessToken(newToken);
				// Reconnect WebSocket with fresh token
				reconnectWebSocket();
				return newToken;
			}
			return null;
		} catch {
			return null;
		} finally {
			isRefreshing = false;
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

/**
 * Handle unauthorized error - logout and show message
 */
function handleUnauthorized(): void {
	console.warn('Unauthorized - logging out...');
	clearAccessToken();
	window.location.href = '/login';
}

/**
 * Check if error is an authentication error
 */
function isAuthError(err: { message?: string; extensions?: { code?: string } }): boolean {
	return (
		err.message === 'Unauthorized' ||
		err.extensions?.code === 'UNAUTHENTICATED' ||
		err.extensions?.code === 'FORBIDDEN'
	);
}

// Error handling link with retry logic for 403 and 502 errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
	const context = operation.getContext();

	// Handle 502 Bad Gateway errors with retry
	if (networkError && 'statusCode' in networkError && networkError.statusCode === 502) {
		const retryCount = context.retryCount ?? 0;
		const MAX_RETRIES = 2;

		if (retryCount < MAX_RETRIES) {
			// Retry the operation with incremented retry count
			operation.setContext({
				...context,
				retryCount: retryCount + 1,
			});

			return new Observable<FetchResult>((observer) => {
				setTimeout(
					() => {
						// Add small delay before retry
						forward(operation).subscribe({
							next: observer.next.bind(observer),
							error: observer.error.bind(observer),
							complete: observer.complete.bind(observer),
						});
					},
					500 * (retryCount + 1),
				); // Exponential backoff: 500ms, 1000ms
			});
		}
		// Max retries reached, forward the error
	}

	const hasAuthError =
		graphQLErrors?.some(isAuthError) ||
		(networkError && 'statusCode' in networkError && networkError.statusCode === 403);

	if (hasAuthError) {
		// Check if we've already tried refreshing for this operation
		if (context.hasTriedRefresh) {
			// Already tried refreshing, logout
			handleUnauthorized();
			return;
		}

		// Try refreshing the token once
		return new Observable<FetchResult>((observer) => {
			attemptTokenRefresh()
				.then((newToken) => {
					if (newToken) {
						// Update operation context to mark that we've tried refreshing
						operation.setContext({
							...context,
							hasTriedRefresh: true,
							headers: {
								...context.headers,
								authorization: `Bearer ${newToken}`,
							},
						});

						// Retry the operation
						const subscriber = {
							next: observer.next.bind(observer),
							error: observer.error.bind(observer),
							complete: observer.complete.bind(observer),
						};

						forward(operation).subscribe(subscriber);
					} else {
						// Refresh failed, logout
						handleUnauthorized();
						observer.error(graphQLErrors?.[0] ?? networkError);
					}
				})
				.catch(() => {
					handleUnauthorized();
					observer.error(graphQLErrors?.[0] ?? networkError);
				});
		});
	}
});

// Reset error counter on successful operations (kept for backward compatibility)
export function resetAuthErrorCounter(): void {
	// No longer needed with new retry logic, but kept for API compatibility
}

// Export refresh function for use by auth hooks
export { attemptTokenRefresh };

/**
 * Exponential backoff for WebSocket reconnection attempts
 * The retries argument contains the number of completed retries
 */
function retryWait(retries: number): Promise<void> {
	// Generate exponential backoff delay: 500ms, 1s, 2s, 4s, 8s
	const delay = Math.min(500 * 2 ** retries, 8000);
	console.debug(`[WS] Reconnection attempt ${retries + 1}, waiting ${delay}ms`);
	return new Promise((resolve) => setTimeout(resolve, delay));
}

// Create and store the WebSocket client for later access
const wsClient = createClient({
	url: WS_URL,
	lazy: true, // Only connect when there are active subscriptions
	connectionParams: () => ({
		authToken: getAccessToken(),
	}),
	retryAttempts: 5,
	retryWait,
	on: {
		connecting: () => {
			console.debug('[WS] Connecting...');
		},
		connected: () => {
			console.debug('[WS] Connected');
		},
		ping: () => {
			console.debug('[WS] Ping');
		},
		pong: () => {
			console.debug('[WS] Pong');
		},
		opened: () => {
			console.debug('[WS] Opened');
		},
		closed: (event: unknown) => {
			// Type-safe property access for CloseEvent
			const code = event && typeof event === 'object' && 'code' in event ? event.code : 'unknown';
			const reason = event && typeof event === 'object' && 'reason' in event ? event.reason : '';
			console.debug(`[WS] Closed: code=${String(code)} reason=${String(reason)}`);
		},
		error: (error: unknown) => {
			console.error('[WS] Error:', error);
		},
	},
});

/**
 * Re-establish the WebSocket connection with fresh auth token
 * Call this when the access token is refreshed
 */
function reconnectWebSocket(): void {
	console.debug('[WS] Reconnecting with fresh token...');
	// Terminate existing connection - lazy mode will reconnect when subscriptions are active
	wsClient.terminate();
}

const wsLink = new GraphQLWsLink(wsClient);

const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
	},
	wsLink,
	from([errorLink, authLink, httpLink]),
);

export const client = new ApolloClient({
	link: splitLink,
	cache: new InMemoryCache({
		typePolicies: {
			Query: {
				fields: {
					allMatches: {
						// Just replace the entire array when new data comes in
						// This is safe because allMatches refetches the complete list
						merge: (_existing, incoming) => incoming,
					},
				},
			},
		},
	}),
});
