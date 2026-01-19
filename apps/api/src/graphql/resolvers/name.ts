import { nameService } from '../../services/name.service';

export const nameResolvers = {
	Query: {
		nextName: async (_: any, __: any, context: any) => {
			if (!context.user) throw new Error('Unauthorized');
			return nameService.getNextName(context.user.id);
		},
	},
	Mutation: {
		seedNames: async (_: any, __: any, context: any) => {
			// Typically admin only, but for MVP allow anyone or check auth
			return nameService.seedNames();
		},
	},
};
