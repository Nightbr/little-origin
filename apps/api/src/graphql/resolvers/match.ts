import { type Name, type User, names, reviews, users } from '@little-origin/core';
import { and, eq } from 'drizzle-orm';
import { withFilter } from 'graphql-subscriptions';
import { db } from '../../db/client';
import { EVENTS, pubsub } from '../../pubsub';
import { matchService } from '../../services/match.service';
import type { GraphQLContext } from '../types';

interface MatchParent {
	nameId: number;
	name?: Name;
	likedBy?: User[];
}

interface MatchCreatedPayload {
	matchCreated: {
		likedBy: User[];
	};
}

export const matchResolvers = {
	Query: {
		allMatches: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			return matchService.getAllMatches();
		},
	},
	Subscription: {
		matchCreated: {
			subscribe: withFilter(
				() => pubsub.asyncIterator([EVENTS.MATCH_CREATED]),
				(payload: MatchCreatedPayload, _variables: unknown, context: GraphQLContext) => {
					// payload.matchCreated contains likedBy users
					return payload.matchCreated.likedBy.some((u) => u.id === context.user?.id);
				},
			),
		},
	},
	Match: {
		name: async (parent: MatchParent) => {
			if (parent.name) return parent.name;
			const [n] = await db.select().from(names).where(eq(names.id, parent.nameId));
			return n;
		},
		likedBy: async (parent: MatchParent) => {
			if (parent.likedBy) return parent.likedBy;
			return db
				.select({
					id: users.id,
					username: users.username,
					createdAt: users.createdAt,
				})
				.from(users)
				.innerJoin(reviews, eq(users.id, reviews.userId))
				.where(and(eq(reviews.nameId, parent.nameId), eq(reviews.isLiked, true)));
		},
	},
};
