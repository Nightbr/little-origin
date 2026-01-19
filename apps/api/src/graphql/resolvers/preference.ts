import { preferencesService } from '../../services/preferences.service';

export const preferenceResolvers = {
  Query: {
    preferences: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');
      return preferencesService.getPreferences();
    },
  },
  Mutation: {
    updatePreferences: async (_: any, { input }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');
      return preferencesService.setPreferences(input);
    },
  },
};
