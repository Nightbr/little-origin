import { nameService } from '../../services/name.service';
import type { GraphQLContext } from '../types';

interface NextNamesArgs {
	limit?: number;
	excludeIds?: string[];
}

export const nameResolvers = {
	Query: {
		nextName: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			return nameService.getNextName(context.user.id);
		},
		nextNames: async (_: unknown, args: NextNamesArgs, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			// Convert string IDs to numbers for the database
			const excludeIds =
				args.excludeIds?.map((id) => Number.parseInt(id, 10)).filter((id) => !Number.isNaN(id)) ??
				[];
			return nameService.getNextNames(context.user.id, args.limit ?? 2, excludeIds);
		},
	},
	Mutation: {
		seedNames: async (_: unknown, __: unknown, _context: GraphQLContext) => {
			// Typically admin only, but for MVP allow anyone or check auth
			return nameService.seedNames();
		},
	},
};
