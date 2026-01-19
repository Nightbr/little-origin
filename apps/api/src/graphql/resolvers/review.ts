import { reviewService } from '../../services/review.service';
import { db } from '../../db/client';
import { names, users } from '@little-origin/core';
import { eq } from 'drizzle-orm';

export const reviewResolvers = {
  Query: {
    likedNames: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');
      return reviewService.getLikedNames(context.user.id);
    },
    dislikedNames: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');
      return reviewService.getDislikedNames(context.user.id);
    },
  },
  Mutation: {
    reviewName: async (_: any, { nameId, isLiked }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');
      return reviewService.reviewName(context.user.id, Number.parseInt(nameId), isLiked);
    },
    undoLastReview: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');
      return reviewService.undoLastReview(context.user.id);
    },
  },
  Review: {
    user: async (parent: any) => {
      const [user] = await db.select().from(users).where(eq(users.id, parent.userId));
      return user;
    },
    name: async (parent: any) => {
      const [name] = await db.select().from(names).where(eq(names.id, parent.nameId));
      return name;
    },
  },
};
