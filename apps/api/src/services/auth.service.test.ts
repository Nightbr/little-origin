import { type User, matches, names, preferences, reviews, users } from '@little-origin/core';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { runMigrations } from '../db/migrate';
import { authService } from './auth.service';
import { reviewService } from './review.service';

describe('AuthService Integration Tests', () => {
	let testUser1: User;
	let testUser2: User;
	let testUser3: User;
	let testNames: Array<typeof names.$inferSelect>;

	beforeAll(async () => {
		await runMigrations();

		// Clean up any existing test users
		await db.delete(users).where(eq(users.username, 'authtestuser1'));
		await db.delete(users).where(eq(users.username, 'authtestuser2'));
		await db.delete(users).where(eq(users.username, 'authtestuser3'));

		// Create test users
		const [user1] = await db
			.insert(users)
			.values({ username: 'authtestuser1', passwordHash: 'hash1' })
			.returning();
		testUser1 = user1;

		const [user2] = await db
			.insert(users)
			.values({ username: 'authtestuser2', passwordHash: 'hash2' })
			.returning();
		testUser2 = user2;

		const [user3] = await db
			.insert(users)
			.values({ username: 'authtestuser3', passwordHash: 'hash3' })
			.returning();
		testUser3 = user3;

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
		// Clean up in order: matches (depends on reviews), reviews, names
		await db.delete(matches);
		await db.delete(reviews);
		await db.delete(names);

		// Insert test names
		testNames = await db
			.insert(names)
			.values([
				{ name: 'Alice', gender: 'female', originCountry: 'FR', source: 'static' },
				{ name: 'Bob', gender: 'male', originCountry: 'US', source: 'static' },
				{ name: 'Charlie', gender: 'male', originCountry: 'US', source: 'static' },
			])
			.returning();
	});

	describe('deleteUser', () => {
		it('should delete a user successfully', async () => {
			await authService.deleteUser(testUser3.id, testUser1.id);

			// Verify user is deleted
			const [deletedUser] = await db.select().from(users).where(eq(users.id, testUser3.id));
			expect(deletedUser).toBeUndefined();
		});

		it('should cascade delete reviews when user is deleted', async () => {
			// Create reviews for user3
			await reviewService.reviewName(testUser3.id, testNames[0].id, true);
			await reviewService.reviewName(testUser3.id, testNames[1].id, false);

			// Verify reviews exist
			const reviewsBefore = await db
				.select()
				.from(reviews)
				.where(eq(reviews.userId, testUser3.id));
			expect(reviewsBefore).toHaveLength(2);

			// Delete user
			await authService.deleteUser(testUser3.id, testUser1.id);

			// Verify reviews are cascade deleted
			const reviewsAfter = await db
				.select()
				.from(reviews)
				.where(eq(reviews.userId, testUser3.id));
			expect(reviewsAfter).toHaveLength(0);
		});

		it('should throw error when trying to delete the last user', async () => {
			// Get current user count
			const userCount = await db.select({ count: users.id }).from(users);

			// Delete all but one user
			for (const user of [testUser2, testUser3]) {
				try {
					await db.delete(users).where(eq(users.id, user.id));
				} catch {
					// Ignore if already deleted
				}
			}

			// Verify we have only 1 user
			const [countResult] = await db.select({ count: users.id }).from(users);
			expect(countResult.count).toBe(1);

			// Try to delete the last user - should throw error
			await expect(authService.deleteUser(testUser1.id, testUser1.id)).rejects.toThrow(
				'Cannot delete the last user',
			);
		});

		it('should throw error when user does not exist', async () => {
			const nonExistentUserId = 99999;

			await expect(
				authService.deleteUser(nonExistentUserId, testUser1.id),
			).rejects.toThrow('User not found');
		});

		it('should allow deletion when there are multiple users', async () => {
			// Verify we have 3 users
			const [countBefore] = await db.select({ count: users.id }).from(users);
			expect(countBefore.count).toBeGreaterThanOrEqual(2);

			// Should not throw
			await expect(
				authService.deleteUser(testUser3.id, testUser1.id),
			).resolves.not.toThrow();
		});
	});

	describe('deleteUser with matches', () => {
		beforeEach(async () => {
			// Create reviews for all 3 users on the same name
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);
			await reviewService.reviewName(testUser3.id, testNames[0].id, true);
		});

		it('should delete user when they have reviews that created matches', async () => {
			// Verify match exists with 3 likes
			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore).toBeDefined();
			expect(matchBefore?.userCount).toBe(3);

			// Delete user3
			await authService.deleteUser(testUser3.id, testUser1.id);

			// Verify user is deleted
			const [deletedUser] = await db.select().from(users).where(eq(users.id, testUser3.id));
			expect(deletedUser).toBeUndefined();
		});

		it('should cascade delete reviews from deleted user', async () => {
			// Count reviews before deletion
			const [reviewsCountBefore] = await db
				.select({ count: reviews.id })
				.from(reviews)
				.where(eq(reviews.userId, testUser3.id));
			expect(reviewsCountBefore.count).toBe(1);

			// Delete user
			await authService.deleteUser(testUser3.id, testUser1.id);

			// Verify review is deleted
			const [reviewsCountAfter] = await db
				.select({ count: reviews.id })
				.from(reviews)
				.where(eq(reviews.userId, testUser3.id));
			expect(reviewsCountAfter.count).toBe(0);
		});
	});
});
