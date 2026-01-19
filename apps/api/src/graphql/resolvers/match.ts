import { matchService } from '../../services/match.service';
import { pubsub, EVENTS } from '../../pubsub';
import { db } from '../../db/client';
import { names, users, reviews } from '@little-origin/core';
import { eq, and } from 'drizzle-orm';
import { withFilter } from 'graphql-subscriptions';

export const matchResolvers = {
  Query: {
    allMatches: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');
      return matchService.getAllMatches();
    },
  },
  Subscription: {
    matchCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.MATCH_CREATED]),
        (payload, variables, context) => {
          // payload.matchCreated contains likedBy users
          return payload.matchCreated.likedBy.some((u: any) => u.id === context.user?.id);
        },
      ),
    },
  },
  Match: {
    name: async (parent: any) => {
      if (parent.name) return parent.name;
      const [n] = await db.select().from(names).where(eq(names.id, parent.nameId));
      return n;
    },
    likedBy: async (parent: any) => {
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
