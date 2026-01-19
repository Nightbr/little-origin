import type { InsertPreferences } from '@little-origin/core';
import { preferencesService } from '../../services/preferences.service';
import type { GraphQLContext } from '../types';

interface UpdatePreferencesArgs {
	input: InsertPreferences;
}

export const preferenceResolvers = {
	Query: {
		preferences: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			return preferencesService.getPreferences();
		},
	},
	Mutation: {
		updatePreferences: async (
			_: unknown,
			{ input }: UpdatePreferencesArgs,
			context: GraphQLContext,
		) => {
			if (!context.user) throw new Error('Unauthorized');
			return preferencesService.setPreferences(input);
		},
	},
};
