import { db } from '../db/client';
import { names, preferences, reviews } from '@little-origin/core';
import { getNamesByCountries } from '@little-origin/name-data';
import { eq, notInArray, and, inArray, sql } from 'drizzle-orm';
import { DEFAULT_PREFERENCES } from '@little-origin/core/src/constants';

export class NameService {
  async seedNames(countToSeed = 250) {
    // Get preferences (singleton)
    const prefsList = await db.select().from(preferences).limit(1);
    const prefs = prefsList[0] || DEFAULT_PREFERENCES;

    // Load static names
    const staticNames = getNamesByCountries(prefs.countryOrigins, prefs.genderPreference, prefs.maxCharacters);

    if (staticNames.length === 0) return { count: 0, source: 'static' };

    // Insert (on conflict do nothing)
    const values = staticNames.slice(0, countToSeed).map((n) => ({
      name: n.name,
      gender: n.gender,
      originCountry: n.country,
      source: 'static' as const,
    }));

    // Chunk insert to avoid sqlite limits if necessary, but 250 is fine.
    // Drizzle's onConflictDoNothing needs target.
    // We already defined uniqueNameGender constraint in schema.

    // SQLite insert or ignore
    const start = Date.now();
    let insertedCount = 0;

    // Naive implementation: insert one by one or in batches with proper handling
    // Drizzle `onConflictDoNothing` works with SQLite
    const res = await db.insert(names).values(values).onConflictDoNothing().returning();
    insertedCount = res.length;

    return { count: insertedCount, source: 'static' };
  }

  async getNextName(userId: number) {
    // Get preferences
    const prefsList = await db.select().from(preferences).limit(1);
    const prefs = prefsList[0] || DEFAULT_PREFERENCES;

    // Subquery: names reviewed by user
    const reviewedIdsQuery = db.select({ nameId: reviews.nameId }).from(reviews).where(eq(reviews.userId, userId));

    // Build filters
    const filters = [notInArray(names.id, reviewedIdsQuery)];

    if (prefs.genderPreference !== 'both') {
      filters.push(eq(names.gender, prefs.genderPreference as 'male' | 'female'));
    }

    if (prefs.countryOrigins && prefs.countryOrigins.length > 0) {
      filters.push(inArray(names.originCountry, prefs.countryOrigins));
    }

    if (prefs.maxCharacters) {
      filters.push(sql`length(${names.name}) <= ${prefs.maxCharacters}`);
    }

    const result = await db
      .select()
      .from(names)
      .where(and(...filters))
      .limit(1);

    return result[0] || null;
  }
}

export const nameService = new NameService();
