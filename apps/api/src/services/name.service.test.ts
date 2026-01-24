import { type User, names, preferences, reviews, users } from '@little-origin/core';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { runMigrations } from '../db/migrate';
import { nameService } from './name.service';
import { preferencesService } from './preferences.service';

describe('NameService Integration Tests', () => {
	let testUser: User;

	beforeAll(async () => {
		// Ensure migrations are run
		await runMigrations();

		// Ensure we have a user
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.username, 'testuser'))
			.limit(1);
		if (existingUser.length > 0) {
			testUser = existingUser[0];
		} else {
			const [user] = await db
				.insert(users)
				.values({
					username: 'testuser',
					passwordHash: 'hash',
				})
				.returning();
			testUser = user;
		}

		// Ensure we have a preference record
		const existingPref = await db.select().from(preferences).where(eq(preferences.id, 1)).limit(1);
		if (existingPref.length === 0) {
			await db.insert(preferences).values({
				id: 1,
				countryOrigins: ['US'],
				genderPreference: 'both',
				maxCharacters: 20,
			});
		}
	});

	beforeEach(async () => {
		// Clear preferences cache between tests
		preferencesService.clearCache();

		// Clean up all reviews first (FK constraint: reviews reference names)
		await db.delete(reviews);

		// Clear all names and seed specific test names
		await db.delete(names);
		await db.insert(names).values([
			{ name: 'Alice', gender: 'female', originCountry: 'FR', source: 'static' },
			{ name: 'Bob', gender: 'male', originCountry: 'US', source: 'static' },
			{ name: 'Catherine', gender: 'female', originCountry: 'US', source: 'static' },
			{ name: 'Diego', gender: 'male', originCountry: 'ES', source: 'static' },
		]);
	});

	it('should filter by gender: female', async () => {
		await db
			.update(preferences)
			.set({ genderPreference: 'female', countryOrigins: ['FR', 'US', 'ES'], maxCharacters: 20 })
			.where(eq(preferences.id, 1));

		const name = await nameService.getNextName(testUser.id);
		expect(name?.gender).toBe('female');
		expect(['Alice', 'Catherine']).toContain(name?.name);
	});

	it('should filter by country: FR', async () => {
		await db
			.update(preferences)
			.set({ genderPreference: 'both', countryOrigins: ['FR'], maxCharacters: 20 })
			.where(eq(preferences.id, 1));

		const name = await nameService.getNextName(testUser.id);
		expect(name?.originCountry).toBe('FR');
		expect(name?.name).toBe('Alice');
	});

	it('should filter by max length: 4', async () => {
		await db
			.update(preferences)
			.set({ genderPreference: 'both', countryOrigins: ['FR', 'US', 'ES'], maxCharacters: 4 })
			.where(eq(preferences.id, 1));

		const name = await nameService.getNextName(testUser.id);
		expect(name?.name.length).toBeLessThanOrEqual(4);
		expect(name?.name).toBe('Bob');
	});

	it('should respect multiple filters simultaneously', async () => {
		await db
			.update(preferences)
			.set({
				genderPreference: 'female',
				countryOrigins: ['FR'],
				maxCharacters: 10,
			})
			.where(eq(preferences.id, 1));

		const name = await nameService.getNextName(testUser.id);
		expect(name?.name).toBe('Alice');
		expect(name?.gender).toBe('female');
		expect(name?.originCountry).toBe('FR');
	});

	it('should return null when no matches found', async () => {
		await db
			.update(preferences)
			.set({
				genderPreference: 'male',
				countryOrigins: ['FR'],
				maxCharacters: 20,
			})
			.where(eq(preferences.id, 1));

		const name = await nameService.getNextName(testUser.id);
		expect(name).toBeNull();
	});

	it('should not suggest already reviewed names', async () => {
		await db
			.update(preferences)
			.set({
				genderPreference: 'both',
				countryOrigins: ['FR', 'US', 'ES'],
				maxCharacters: 20,
			})
			.where(eq(preferences.id, 1));

		const first = await nameService.getNextName(testUser.id);
		expect(first).not.toBeNull();

		await db.insert(reviews).values({
			userId: testUser.id,
			nameId: first?.id,
			isLiked: true,
		});

		const second = await nameService.getNextName(testUser.id);
		expect(second).not.toBeNull();
		expect(second?.id).not.toBe(first?.id);
	});

	it('should exclude IDs passed in excludeIds parameter', async () => {
		await db
			.update(preferences)
			.set({
				genderPreference: 'both',
				countryOrigins: ['FR', 'US', 'ES'],
				maxCharacters: 20,
			})
			.where(eq(preferences.id, 1));

		// Get all available names
		const allNames = await db.select().from(names);
		expect(allNames.length).toBe(4);

		// Exclude first two names
		const excludeIds = [allNames[0].id, allNames[1].id];

		// Request 3 names but 2 are excluded, so should only get 2
		const result = await nameService.getNextNames(testUser.id, 3, excludeIds);

		expect(result.length).toBe(2);
		expect(result.map((n) => n.id)).not.toContain(allNames[0].id);
		expect(result.map((n) => n.id)).not.toContain(allNames[1].id);
	});

	it('should handle empty excludeIds array', async () => {
		await db
			.update(preferences)
			.set({
				genderPreference: 'both',
				countryOrigins: ['FR', 'US', 'ES'],
				maxCharacters: 20,
			})
			.where(eq(preferences.id, 1));

		// With no exclusions, should return all available names
		const result = await nameService.getNextNames(testUser.id, 10, []);

		expect(result.length).toBe(4);
	});

	it('should combine excludeIds with reviewed names filtering', async () => {
		await db
			.update(preferences)
			.set({
				genderPreference: 'both',
				countryOrigins: ['FR', 'US', 'ES'],
				maxCharacters: 20,
			})
			.where(eq(preferences.id, 1));

		// Get all names
		const allNames = await db.select().from(names);

		// Mark one as reviewed
		await db.insert(reviews).values({
			userId: testUser.id,
			nameId: allNames[0].id,
			isLiked: true,
		});

		// Exclude a different name
		const excludeIds = [allNames[1].id];

		// Should get the remaining 2 names (excluding both reviewed and excluded)
		const result = await nameService.getNextNames(testUser.id, 10, excludeIds);

		expect(result.length).toBe(2);
		expect(result.map((n) => n.id)).not.toContain(allNames[0].id); // reviewed
		expect(result.map((n) => n.id)).not.toContain(allNames[1].id); // excluded
	});
});
