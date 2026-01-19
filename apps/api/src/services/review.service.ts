import { names, reviews } from '@little-origin/core';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { matchService } from './match.service';

export class ReviewService {
	async reviewName(userId: number, nameId: number, isLiked: boolean) {
		// Upsert review? Or just insert.
		// Schema has unique constraint on userId, nameId.

		const [review] = await db
			.insert(reviews)
			.values({ userId, nameId, isLiked })
			.onConflictDoUpdate({
				target: [reviews.userId, reviews.nameId],
				set: { isLiked, reviewedAt: new Date() },
			})
			.returning();

		if (isLiked) {
			await matchService.checkAndCreateMatch(nameId);
		} else {
			// If changing from Liked to Disliked, we might need to remove match?
			// checkMatch handles "likes < 2"
			await matchService.checkAndCreateMatch(nameId);
		}

		return review;
	}

	async undoLastReview(userId: number) {
		const lastReview = await db
			.select()
			.from(reviews)
			.where(eq(reviews.userId, userId))
			.orderBy(desc(reviews.reviewedAt))
			.limit(1);

		if (!lastReview[0]) return null;

		await db.delete(reviews).where(eq(reviews.id, lastReview[0].id));

		// Recalculate match
		await matchService.checkAndCreateMatch(lastReview[0].nameId);

		return lastReview[0];
	}

	async getLikedNames(userId: number) {
		return db
			.select({
				id: names.id,
				name: names.name,
				gender: names.gender,
				originCountry: names.originCountry,
				source: names.source,
				createdAt: names.createdAt,
			})
			.from(names)
			.innerJoin(reviews, eq(names.id, reviews.nameId))
			.where(and(eq(reviews.userId, userId), eq(reviews.isLiked, true)))
			.orderBy(desc(reviews.reviewedAt));
	}

	async getDislikedNames(userId: number) {
		return db
			.select({
				id: names.id,
				name: names.name,
				gender: names.gender,
				originCountry: names.originCountry,
				source: names.source,
				createdAt: names.createdAt,
			})
			.from(names)
			.innerJoin(reviews, eq(names.id, reviews.nameId))
			.where(and(eq(reviews.userId, userId), eq(reviews.isLiked, false)))
			.orderBy(desc(reviews.reviewedAt));
	}
}

export const reviewService = new ReviewService();
