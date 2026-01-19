import { db } from '../db/client';
import { matches, reviews, users } from '@little-origin/core';
import { eq, and, count, desc } from 'drizzle-orm';
import { pubsub, EVENTS } from '../pubsub';

export class MatchService {
  private readonly MATCH_THRESHOLD = 2;

  async checkAndCreateMatch(nameId: number): Promise<typeof matches.$inferSelect | null> {
    // Count likes
    const result = await db
      .select({ count: count() })
      .from(reviews)
      .where(and(eq(reviews.nameId, nameId), eq(reviews.isLiked, true)));

    const likesCount = result[0].count;

    // Check if match exists
    const existingMatch = await db.select().from(matches).where(eq(matches.nameId, nameId)).limit(1);

    if (likesCount < this.MATCH_THRESHOLD) {
      if (existingMatch.length > 0) {
        // Delete match if no longer valid (undo case)
        await db.delete(matches).where(eq(matches.id, existingMatch[0].id));
      }
      return null;
    }

    if (existingMatch.length > 0) {
      // Update count
      const [updated] = await db.update(matches).set({ userCount: likesCount }).where(eq(matches.id, existingMatch[0].id)).returning();

      // Publish update (e.g. 3rd person likes)
      const fullMatch = await this.getMatchWithDetails(updated.id);
      if (fullMatch) {
        pubsub.publish(EVENTS.MATCH_CREATED, { matchCreated: fullMatch });
      }

      return updated;
    }

    // Create new match
    const [newMatch] = await db.insert(matches).values({ nameId, userCount: likesCount }).returning();

    // Publish
    const fullMatch = await this.getMatchWithDetails(newMatch.id);
    if (fullMatch) {
      pubsub.publish(EVENTS.MATCH_CREATED, { matchCreated: fullMatch });
    }

    return newMatch;
  }

  async getMatchWithDetails(matchId: number) {
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) return null;

    // Fetch liked users
    const likedUsers = await db
      .select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(reviews, eq(users.id, reviews.userId))
      .where(and(eq(reviews.nameId, match.nameId), eq(reviews.isLiked, true)));

    return {
      ...match,
      likedBy: likedUsers,
    };
  }

  async getAllMatches() {
    return db.select().from(matches).orderBy(desc(matches.matchedAt));
  }
}

export const matchService = new MatchService();
