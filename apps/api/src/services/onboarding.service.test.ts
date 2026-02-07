import { appSettings, names, preferences, users } from '@little-origin/core';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { runMigrations } from '../db/migrate';
import { onboardingService } from './onboarding.service';

describe('OnboardingService Integration Tests', () => {
	beforeAll(async () => {
		// Ensure migrations are run
		await runMigrations();

		// Clean start
		await db.delete(appSettings);
		await db.delete(users);
		await db.delete(preferences);
		await db.delete(names);
	});

	beforeEach(async () => {
		await db.delete(appSettings);
		await db.delete(users);
		await db.delete(preferences);
	});

	it('should return hasUsers = false when no users exist', async () => {
		const hasUsers = await onboardingService.hasUsers();
		expect(hasUsers).toBe(false);
	});

	it('should return isOnboardingComplete = false by default', async () => {
		const isComplete = await onboardingService.isOnboardingComplete();
		expect(isComplete).toBe(false);
	});

	it('should add a user during onboarding', async () => {
		const user = await onboardingService.addOnboardingMember('onboard_user', 'password123');
		expect(user.username).toBe('onboard_user');

		const hasUsers = await onboardingService.hasUsers();
		expect(hasUsers).toBe(true);
	});

	it('should save preferences during onboarding', async () => {
		const prefs = {
			countryOrigins: ['FR', 'IT'],
			genderPreference: 'female' as const,
			maxCharacters: 15,
		};

		await onboardingService.savePreferences(prefs);

		const saved = await db.select().from(preferences).where(eq(preferences.id, 1)).limit(1);
		expect(saved[0].countryOrigins).toEqual(['FR', 'IT']);
		expect(saved[0].genderPreference).toBe('female');
	});

	it('should complete onboarding and seed names', async () => {
		// Prepare: add a user
		await onboardingService.addOnboardingMember('final_user', 'password123');

		const complete = await onboardingService.completeOnboarding();
		expect(complete).toBe(true);

		const isComplete = await onboardingService.isOnboardingComplete();
		expect(isComplete).toBe(true);

		// Check names were seeded
		const seededNames = await db.select().from(names);
		expect(seededNames.length).toBeGreaterThan(0);
	});

	it('should block adding users after onboarding is complete', async () => {
		await db.insert(appSettings).values({ id: 1, onboardingCompleted: true });

		await expect(onboardingService.addOnboardingMember('late_user', 'password123')).rejects.toThrow(
			'Onboarding already completed',
		);
	});
});
