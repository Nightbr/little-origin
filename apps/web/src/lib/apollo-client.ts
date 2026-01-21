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

const wsLink = new GraphQLWsLink(
	createClient({
		url: WS_URL,
		connectionParams: () => ({
			authToken: getAccessToken(),
		}),
	}),
);

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
	cache: new InMemoryCache(),
});
