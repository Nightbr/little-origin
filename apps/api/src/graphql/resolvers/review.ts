import { names, users } from '@little-origin/core';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { reviewService } from '../../services/review.service';
import type { GraphQLContext } from '../types';

interface ReviewNameArgs {
	nameId: string;
	isLiked: boolean;
}

interface ReviewParent {
	userId: number;
	nameId: number;
}

export const reviewResolvers = {
	Query: {
		likedNames: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			return reviewService.getLikedNames(context.user.id);
		},
		dislikedNames: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			return reviewService.getDislikedNames(context.user.id);
		},
	},
	Mutation: {
		reviewName: async (
			_: unknown,
			{ nameId, isLiked }: ReviewNameArgs,
			context: GraphQLContext,
		) => {
			if (!context.user) throw new Error('Unauthorized');
			return reviewService.reviewName(context.user.id, Number.parseInt(nameId), isLiked);
		},
		undoLastReview: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			return reviewService.undoLastReview(context.user.id);
		},
	},
	Review: {
		user: async (parent: ReviewParent) => {
			const [user] = await db.select().from(users).where(eq(users.id, parent.userId));
			return user;
		},
		name: async (parent: ReviewParent) => {
			const [name] = await db.select().from(names).where(eq(names.id, parent.nameId));
			return name;
		},
	},
};
