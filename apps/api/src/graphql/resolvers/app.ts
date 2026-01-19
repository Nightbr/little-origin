import { onboardingService } from '../../services/onboarding.service';

export const appResolvers = {
  Query: {
    appStatus: async () => {
      const hasUsers = await onboardingService.hasUsers();
      const userCount = await onboardingService.getUserCount();
      const isOnboardingComplete = await onboardingService.isOnboardingComplete();
      return { hasUsers, userCount, isOnboardingComplete };
    },
  },
  Mutation: {
    addOnboardingUser: async (_: any, { username, password }: { username: string; password: string }) => {
      return onboardingService.addUser(username, password);
    },
    saveOnboardingPreferences: async (_: any, { input }: { input: any }) => {
      return onboardingService.savePreferences(input);
    },
    completeOnboarding: async () => {
      return onboardingService.completeOnboarding();
    },
  },
};
