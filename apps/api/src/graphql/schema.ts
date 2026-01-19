import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';

export const schema = makeExecutableSchema({
	typeDefs,
	resolvers: resolvers as any, // TS check workaround for merge result
});
