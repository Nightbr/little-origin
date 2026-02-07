import { appSettings, insertUserSchema, users } from '@little-origin/core';
import { MAX_USERS } from '@little-origin/core';
import type { InsertPreferences } from '@little-origin/core';
import { count, eq } from 'drizzle-orm';
import { logger } from '../config/logger';
import { db } from '../db/client';
import { hashPassword } from '../utils/password';
import { nameService } from './name.service';
import { preferencesService } from './preferences.service';

class OnboardingService {
	/**
	 * Check if any users exist in the database
	 */
	async hasUsers(): Promise<boolean> {
		const result = await db.select({ count: count() }).from(users);
		return result[0].count > 0;
	}

	/**
	 * Get the current user count
	 */
	async getUserCount(): Promise<number> {
		const result = await db.select({ count: count() }).from(users);
		return result[0].count;
	}

	/**
	 * Check if onboarding has been completed
	 */
	async isOnboardingComplete(): Promise<boolean> {
		const settings = await db.select().from(appSettings).limit(1);
		if (settings.length === 0) {
			return false;
		}
		return settings[0].onboardingCompleted;
	}

	/**
	 * Add a member during onboarding (no token returned)
	 */
	async addOnboardingMember(username: string, password: string): Promise<{ id: number; username: string }> {
		// Check if onboarding is already complete
		const isComplete = await this.isOnboardingComplete();
		if (isComplete) {
			throw new Error('Onboarding already completed. Use the addMember mutation instead.');
		}

		// Validate limit
		const userCount = await this.getUserCount();
		if (userCount >= MAX_USERS) {
			throw new Error(`Maximum user limit of ${MAX_USERS} reached.`);
		}

		// Validate input
		const validated = insertUserSchema.parse({ username, passwordHash: password });

		// Check for existing username
		const existing = await db.select().from(users).where(eq(users.username, validated.username));
		if (existing.length > 0) {
			throw new Error('Username already taken');
		}

		// Hash password and create user
		const passwordHash = await hashPassword(validated.passwordHash);
		const [user] = await db
			.insert(users)
			.values({
				...validated,
				passwordHash,
			})
			.returning();

		return { id: user.id, username: user.username };
	}

	/**
	 * Save preferences during onboarding (no auth required)
	 */
	async savePreferences(input: InsertPreferences) {
		// Check if onboarding is already complete
		const isComplete = await this.isOnboardingComplete();
		if (isComplete) {
			throw new Error('Onboarding already completed. Use the regular preferences update flow.');
		}

		return preferencesService.setPreferences(input);
	}

	/**
	 * Complete onboarding: seed names and set completion flag
	 */
	async completeOnboarding(): Promise<boolean> {
		// Check if already complete
		const isComplete = await this.isOnboardingComplete();
		if (isComplete) {
			throw new Error('Onboarding already completed.');
		}

		// Require at least one user
		const hasAnyUsers = await this.hasUsers();
		if (!hasAnyUsers) {
			throw new Error('At least one user must be created before completing onboarding.');
		}

		// Seed all names for all available countries
		logger.info('🌱 Seeding names during onboarding...');
		const seedResult = await nameService.seedNames();
		logger.info(
			`✅ Seeded ${seedResult.count}/${seedResult.total} names from ${seedResult.source}`,
		);

		// Set onboarding as complete
		await db
			.insert(appSettings)
			.values({ id: 1, onboardingCompleted: true })
			.onConflictDoUpdate({
				target: appSettings.id,
				set: { onboardingCompleted: true, updatedAt: new Date() },
			});

		return true;
	}
}

export const onboardingService = new OnboardingService();
