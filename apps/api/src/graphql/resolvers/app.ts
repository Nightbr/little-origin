import type { InsertPreferences } from '@little-origin/core';
import { onboardingService } from '../../services/onboarding.service';

interface AddOnboardingUserArgs {
	username: string;
	password: string;
}

interface SaveOnboardingPreferencesArgs {
	input: InsertPreferences;
}

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
		addOnboardingUser: async (_: unknown, { username, password }: AddOnboardingUserArgs) => {
			return onboardingService.addUser(username, password);
		},
		saveOnboardingPreferences: async (_: unknown, { input }: SaveOnboardingPreferencesArgs) => {
			return onboardingService.savePreferences(input);
		},
		completeOnboarding: async () => {
			return onboardingService.completeOnboarding();
		},
	},
};
