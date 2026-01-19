import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
	uri: 'http://localhost:3000/graphql',
	// Credentials include handled by setContext or global fetch option?
	// Apollo handles credentials via fetchOptions typically to include cookies if httpOnly
	// But for JWT in header we use setContext
});

const authLink = setContext((_, { headers }) => {
	const token = localStorage.getItem('token');
	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : '',
		},
	};
});

const wsLink = new GraphQLWsLink(
	createClient({
		url: 'ws://localhost:3000/graphql',
		connectionParams: () => ({
			authToken: localStorage.getItem('token'),
		}),
	}),
);

const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
	},
	wsLink,
	authLink.concat(httpLink),
);

export const client = new ApolloClient({
	link: splitLink,
	cache: new InMemoryCache(),
});
