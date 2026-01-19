import { ApolloClient, InMemoryCache, HttpLink, split, from } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getAccessToken, clearAccessToken } from './auth-token';

const API_URL = 'http://localhost:3000/graphql';
const WS_URL = 'ws://localhost:3000/graphql';

// Track consecutive 403 errors to trigger logout
let consecutiveAuthErrors = 0;
const MAX_AUTH_ERRORS = 3;

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

// Error handling link for 403 errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for authentication errors
      if (err.message === 'Unauthorized' || err.extensions?.code === 'UNAUTHENTICATED' || err.extensions?.code === 'FORBIDDEN') {
        consecutiveAuthErrors++;
        if (consecutiveAuthErrors >= MAX_AUTH_ERRORS) {
          console.warn('Multiple auth errors detected, logging out...');
          clearAccessToken();
          consecutiveAuthErrors = 0;
          // Redirect to login
          window.location.href = '/login';
        }
      } else {
        // Reset counter on successful non-auth error
        consecutiveAuthErrors = 0;
      }
    }
  }

  if (networkError && 'statusCode' in networkError && networkError.statusCode === 403) {
    consecutiveAuthErrors++;
    if (consecutiveAuthErrors >= MAX_AUTH_ERRORS) {
      console.warn('Multiple 403 errors detected, logging out...');
      clearAccessToken();
      consecutiveAuthErrors = 0;
      window.location.href = '/login';
    }
  }
});

// Reset error counter on successful operations
export function resetAuthErrorCounter(): void {
  consecutiveAuthErrors = 0;
}

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
