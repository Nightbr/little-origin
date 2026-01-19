import { authService } from '../../services/auth.service';

export const authResolvers = {
	Query: {
		me: async (_: any, __: any, context: any) => {
			return context.user; // Populated by middleware
		},
	},
	Mutation: {
		register: async (_: any, { username, password }: any) => {
			return authService.register({ username, passwordHash: password }); // Service handles hashing
		},
		login: async (_: any, { username, password }: any) => {
			return authService.login(username, password);
		},
	},
};
