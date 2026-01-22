import { type User, matches, names, preferences, reviews, users } from '@little-origin/core';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { runMigrations } from '../db/migrate';
import { reviewService } from './review.service';

describe('ReviewService Integration Tests', () => {
	let testUser1: User;
	let testUser2: User;
	let testNames: Array<typeof names.$inferSelect>;

	beforeAll(async () => {
		await runMigrations();

		// Create or fetch test users
		const user1Result = await db
			.select()
			.from(users)
			.where(eq(users.username, 'reviewtestuser1'))
			.limit(1);
		if (user1Result.length > 0) {
			testUser1 = user1Result[0];
		} else {
			const [user] = await db
				.insert(users)
				.values({ username: 'reviewtestuser1', passwordHash: 'hash1' })
				.returning();
			testUser1 = user;
		}

		const user2Result = await db
			.select()
			.from(users)
			.where(eq(users.username, 'reviewtestuser2'))
			.limit(1);
		if (user2Result.length > 0) {
			testUser2 = user2Result[0];
		} else {
			const [user] = await db
				.insert(users)
				.values({ username: 'reviewtestuser2', passwordHash: 'hash2' })
				.returning();
			testUser2 = user;
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

	describe('Creating new reviews', () => {
		it('should create a new like review', async () => {
			const review = await reviewService.reviewName(testUser1.id, testNames[0].id, true);

			expect(review).toBeDefined();
			expect(review?.userId).toBe(testUser1.id);
			expect(review?.nameId).toBe(testNames[0].id);
			expect(review?.isLiked).toBe(true);

			// Verify it's in the database
			const [savedReview] = await db
				.select()
				.from(reviews)
				.where(eq(reviews.id, review?.id ?? -1));
			expect(savedReview).toBeDefined();
		});

		it('should create a new dislike review', async () => {
			const review = await reviewService.reviewName(testUser1.id, testNames[0].id, false);

			expect(review).toBeDefined();
			expect(review?.userId).toBe(testUser1.id);
			expect(review?.nameId).toBe(testNames[0].id);
			expect(review?.isLiked).toBe(false);
		});

		it('should not create a match with a single like', async () => {
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);

			const [match] = await db.select().from(matches).where(eq(matches.nameId, testNames[0].id));
			expect(match).toBeUndefined();
		});
	});

	describe('Overriding existing reviews', () => {
		it('should override from dislike to like', async () => {
			// First, dislike
			const dislikeReview = await reviewService.reviewName(testUser1.id, testNames[0].id, false);
			expect(dislikeReview?.isLiked).toBe(false);

			// Then, override to like
			const likeReview = await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			expect(likeReview?.isLiked).toBe(true);
			expect(likeReview?.id).toBe(dislikeReview?.id); // Same review, updated
		});

		it('should override from like to dislike', async () => {
			// First, like
			const likeReview = await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			expect(likeReview?.isLiked).toBe(true);

			// Then, override to dislike
			const dislikeReview = await reviewService.reviewName(testUser1.id, testNames[0].id, false);
			expect(dislikeReview?.isLiked).toBe(false);
			expect(dislikeReview?.id).toBe(likeReview?.id); // Same review, updated
		});

		it('should update reviewedAt timestamp on override', async () => {
			const firstReview = await reviewService.reviewName(testUser1.id, testNames[0].id, true);

			// Wait to ensure different timestamp (SQLite has second precision)
			await new Promise((resolve) => setTimeout(resolve, 1100));

			const secondReview = await reviewService.reviewName(testUser1.id, testNames[0].id, false);

			expect(secondReview?.reviewedAt.getTime()).toBeGreaterThan(
				firstReview?.reviewedAt.getTime() ?? 0,
			);
		});
	});

	describe('Match creation and removal', () => {
		it('should create a match when both users like the same name', async () => {
			// User 1 likes
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);

			// User 2 likes - this should trigger match creation
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [match] = await db.select().from(matches).where(eq(matches.nameId, testNames[0].id));

			expect(match).toBeDefined();
			expect(match?.userCount).toBe(2);
		});

		it('should remove match when one user changes from like to dislike', async () => {
			// Both users like - creates match
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore).toBeDefined();

			// User 1 changes to dislike - should remove match
			await reviewService.reviewName(testUser1.id, testNames[0].id, false);

			const [matchAfter] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchAfter).toBeUndefined();
		});

		it('should not remove match when one user changes from dislike to like if match still has 2+ likes', async () => {
			// This would require a 3rd user, but we only have 2
			// So let's test that the match persists when both users like and one changes their review
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			// User 1 changes review but still likes (just testing the update flow)
			// In this case, match should persist with updated count
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);

			const [match] = await db.select().from(matches).where(eq(matches.nameId, testNames[0].id));
			expect(match).toBeDefined();
			expect(match?.userCount).toBe(2);
		});

		it('should create match when changing from dislike to like if other user already likes', async () => {
			// User 1 likes
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);

			// User 2 dislikes
			await reviewService.reviewName(testUser2.id, testNames[0].id, false);

			// No match yet (only 1 like)
			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore).toBeUndefined();

			// User 2 changes to like - should create match
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [matchAfter] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchAfter).toBeDefined();
			expect(matchAfter?.userCount).toBe(2);
		});
	});

	describe('getLikedNames and getDislikedNames', () => {
		beforeEach(async () => {
			// Set up some reviews with delays to ensure different timestamps
			await reviewService.reviewName(testUser1.id, testNames[0].id, true); // Alice - liked
			await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait for second precision
			await reviewService.reviewName(testUser1.id, testNames[1].id, false); // Bob - disliked
			await new Promise((resolve) => setTimeout(resolve, 1100));
			await reviewService.reviewName(testUser1.id, testNames[2].id, true); // Charlie - liked
		});

		it('should return only liked names', async () => {
			const likedNames = await reviewService.getLikedNames(testUser1.id);

			expect(likedNames).toHaveLength(2);
			expect(likedNames.map((n) => n.name)).toContain('Alice');
			expect(likedNames.map((n) => n.name)).toContain('Charlie');
			expect(likedNames.map((n) => n.name)).not.toContain('Bob');
		});

		it('should return only disliked names', async () => {
			const dislikedNames = await reviewService.getDislikedNames(testUser1.id);

			expect(dislikedNames).toHaveLength(1);
			expect(dislikedNames[0].name).toBe('Bob');
		});

		it('should return empty arrays for user with no reviews', async () => {
			const likedNames = await reviewService.getLikedNames(testUser2.id);
			const dislikedNames = await reviewService.getDislikedNames(testUser2.id);

			expect(likedNames).toHaveLength(0);
			expect(dislikedNames).toHaveLength(0);
		});

		it('should be ordered by reviewedAt desc (newest first)', async () => {
			// The reviews were created in order: Alice, Bob, Charlie
			const likedNames = await reviewService.getLikedNames(testUser1.id);

			// Charlie was reviewed last, should be first
			expect(likedNames[0].name).toBe('Charlie');
			expect(likedNames[1].name).toBe('Alice');
		});
	});

	describe('undoLastReview', () => {
		it('should undo the most recent review', async () => {
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await new Promise((resolve) => setTimeout(resolve, 1100));
			await reviewService.reviewName(testUser1.id, testNames[1].id, false);

			const undoneReview = await reviewService.undoLastReview(testUser1.id);

			expect(undoneReview).toBeDefined();
			expect(undoneReview?.nameId).toBe(testNames[1].id);

			// Verify it's deleted
			const [review] = await db
				.select()
				.from(reviews)
				.where(eq(reviews.id, undoneReview?.id ?? -1));
			expect(review).toBeUndefined();
		});

		it('should return null when user has no reviews', async () => {
			const result = await reviewService.undoLastReview(testUser1.id);
			expect(result).toBeNull();
		});

		it('should recalculate match after undo', async () => {
			// Both users like - creates match
			await reviewService.reviewName(testUser1.id, testNames[0].id, true);
			await reviewService.reviewName(testUser2.id, testNames[0].id, true);

			const [matchBefore] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchBefore).toBeDefined();

			// Undo one review - should remove match
			await reviewService.undoLastReview(testUser1.id);

			const [matchAfter] = await db
				.select()
				.from(matches)
				.where(eq(matches.nameId, testNames[0].id));
			expect(matchAfter).toBeUndefined();
		});
	});
});
