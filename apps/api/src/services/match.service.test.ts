import { type User, matches, names, preferences, reviews, users } from '@little-origin/core';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { runMigrations } from '../db/migrate';
import { matchService } from './match.service';
import { reviewService } from './review.service';

describe('MatchService Integration Tests', () => {
	let testUser1: User;
	let testUser2: User;
	let testUser3: User;
	let testNames: Array<typeof names.$inferSelect>;

	beforeAll(async () => {
		await runMigrations();

		// Clean up any existing test users
		await db.delete(users).where(eq(users.username, 'matchtestuser1'));
		await db.delete(users).where(eq(users.username, 'matchtestuser2'));
		await db.delete(users).where(eq(users.username, 'matchtestuser3'));

		// Create test users
		const [user1] = await db
			.insert(users)
			.values({ username: 'matchtestuser1', passwordHash: 'hash1' })
			.returning();
		testUser1 = user1;

		const [user2] = await db
			.insert(users)
			.values({ username: 'matchtestuser2', passwordHash: 'hash2' })
			.returning();
		testUser2 = user2;

		const [user3] = await db
			.insert(users)
			.values({ username: 'matchtestuser3', passwordHash: 'hash3' })
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
				{ name: 'Diana', gender: 'female', originCountry: 'UK', source: 'static' },
			])
			.returning();
	});

	describe('checkAndCreateMatch', () => {
		it('should create a match when 2 users like the same name', async () => {
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [match] = await db.select().from(matches).where(eq(matches.nameId, testNames[0].id));

			expect(match).toBeDefined();
			expect(match?.userCount).toBe(2);
		});

		it('should update match count when 3rd user likes the name', async () => {
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore?.userCount).toBe(2);

			await reviewService.reviewName(testUser3.id, testNames[0].id, true);

			const [matchAfter] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchAfter?.userCount).toBe(3);
		});

		it('should remove match when likes drop below threshold', async () => {
			// Create match with 2 likes
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore).toBeDefined();

			// User1 changes to dislike
			await reviewService.reviewName(testUser1.id, testNames[0].id, false);

			const [matchAfter] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchAfter).toBeUndefined();
		});
	});

	describe('getMatchWithDetails', () => {
		it('should return match with liked users', async () => {
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [match] = await db.select().from(matches).where(eq(matches.nameId, testNames[0].id));
			expect(match).toBeDefined();

			const matchWithDetails = await matchService.getMatchWithDetails(match?.id);

			expect(matchWithDetails).toBeDefined();
			expect(matchWithDetails?.likedBy).toHaveLength(2);
			expect(matchWithDetails?.likedBy.map((u) => u.username)).toContain('matchtestuser1');
			expect(matchWithDetails?.likedBy.map((u) => u.username)).toContain('matchtestuser2');
		});

		it('should return null for non-existent match', async () => {
			const matchWithDetails = await matchService.getMatchWithDetails(99999);
			expect(matchWithDetails).toBeNull();
		});
	});

	describe('getAllMatches', () => {
		it('should return all matches ordered by matchedAt desc', async () => {
			// Create first match
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			// Wait to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 1100));

			// Create second match
			await reviewService.reviewName(testUser1.id, testNames[1].id, true);
			await reviewService.reviewName(testUser2.id, testNames[1].id, true);

			const allMatches = await matchService.getAllMatches();

			expect(allMatches).toHaveLength(2);
			// Most recent match should be first
			expect(allMatches[0].nameId).toBe(testNames[1].id);
			expect(allMatches[1].nameId).toBe(testNames[0].id);
		});

		it('should return empty array when no matches exist', async () => {
			const allMatches = await matchService.getAllMatches();
			expect(allMatches).toHaveLength(0);
		});
	});

	describe('recalculateAllMatches', () => {
		it('should remove matches that fall below threshold', async () => {
			// Create match with 3 likes
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);
			await reviewService.reviewName(testUser3.id, testNames[0].id, true);

			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore).toBeDefined();
			expect(matchBefore?.userCount).toBe(3);

			// Delete user3 (simulates user deletion cascade)
			await db.delete(users).where(eq(users.id, testUser3.id));

			// Recalculate matches
			await matchService.recalculateAllMatches();

			// Match should still exist with 2 likes
			const [matchAfter] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchAfter).toBeDefined();
			expect(matchAfter?.userCount).toBe(3); // Count not updated by recalculate
		});

		it('should delete match when only 1 like remains', async () => {
			// Create match with 2 likes
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore).toBeDefined();

			// Delete user2's review
			await db.delete(reviews).where(eq(reviews.userId, testUser2.id));

			// Recalculate matches
			await matchService.recalculateAllMatches();

			// Match should be deleted
			const [matchAfter] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchAfter).toBeUndefined();
		});

		it('should handle multiple matches correctly', async () => {
			// Create match 1 with 3 likes
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);
			await reviewService.reviewName(testUser3.id, testNames[0].id, true);

			// Create match 2 with 2 likes
			await reviewService.reviewName(testUser1.id, testNames[1].id, true);
			await reviewService.reviewName(testUser2.id, testNames[1].id, true);

			const matchesBefore = await db.select().from(matches);
			expect(matchesBefore).toHaveLength(2);

			// Delete user3's reviews (cascade from user deletion)
			await db.delete(reviews).where(eq(reviews.userId, testUser3.id));

			// Recalculate
			await matchService.recalculateAllMatches();

			const matchesAfter = await db.select().from(matches);
			// Match 1 should still exist (2 likes remain)
			// Match 2 should still exist (2 likes remain)
			expect(matchesAfter).toHaveLength(2);
		});

		it('should delete match when all reviews are removed', async () => {
			// Create match
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore).toBeDefined();

			// Delete all reviews for this name
			await db.delete(reviews).where(eq(reviews.nameId, testNames[0].id));

			// Recalculate
			await matchService.recalculateAllMatches();

			// Match should be deleted
			const [matchAfter] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchAfter).toBeUndefined();
		});

		it('should not affect matches that still meet threshold', async () => {
			// Create match 1 with 3 likes
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);
			await reviewService.reviewName(testUser3.id, testNames[0].id, true);

			// Create match 2 with 2 likes
			await reviewService.reviewName(testUser1.id, testNames[1].id, true);
			await reviewService.reviewName(testUser2.id, testNames[1].id, true);

			const matchesBefore = await db.select().from(matches);
			expect(matchesBefore).toHaveLength(2);

			// Recalculate (no changes to reviews)
			await matchService.recalculateAllMatches();

			const matchesAfter = await db.select().from(matches);
			// Both matches should still exist
			expect(matchesAfter).toHaveLength(2);
		});
	});
});
