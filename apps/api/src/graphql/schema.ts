import { makeExecutableSchema } from '@graphql-tools/schema';
import type { IResolvers } from '@graphql-tools/utils';
import { resolvers } from './resolvers';
import { typeDefs } from './typeDefs';

export const schema = makeExecutableSchema({
	typeDefs,
	resolvers: resolvers as IResolvers,
});
