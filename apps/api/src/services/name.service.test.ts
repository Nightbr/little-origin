import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { db } from '../db/client';
import { names, preferences, users, reviews } from '@little-origin/core';
import { nameService } from './name.service';
import { eq } from 'drizzle-orm';

describe('NameService Integration Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    // Ensure we have a user
    const existingUser = await db.select().from(users).where(eq(users.username, 'testuser')).limit(1);
    if (existingUser.length > 0) {
      testUser = existingUser[0];
    } else {
      const [user] = await db
        .insert(users)
        .values({
          username: 'testuser',
          passwordHash: 'hash',
        })
        .returning();
      testUser = user;
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
    // Clean up reviews for test user
    await db.delete(reviews).where(eq(reviews.userId, testUser.id));

    // Seed some specific test names
    await db.delete(names);
    await db.insert(names).values([
      { name: 'Alice', gender: 'female', originCountry: 'FR', source: 'static' },
      { name: 'Bob', male: 'male', originCountry: 'US', source: 'static', gender: 'male' },
      { name: 'Catherine', gender: 'female', originCountry: 'US', source: 'static' },
      { name: 'Diego', gender: 'male', originCountry: 'ES', source: 'static' },
    ]);
  });

  it('should filter by gender: female', async () => {
    await db
      .update(preferences)
      .set({ genderPreference: 'female', countryOrigins: ['FR', 'US', 'ES'], maxCharacters: 20 })
      .where(eq(preferences.id, 1));

    const name = await nameService.getNextName(testUser.id);
    expect(name?.gender).toBe('female');
    expect(['Alice', 'Catherine']).toContain(name?.name);
  });

  it('should filter by country: FR', async () => {
    await db
      .update(preferences)
      .set({ genderPreference: 'both', countryOrigins: ['FR'], maxCharacters: 20 })
      .where(eq(preferences.id, 1));

    const name = await nameService.getNextName(testUser.id);
    expect(name?.originCountry).toBe('FR');
    expect(name?.name).toBe('Alice');
  });

  it('should filter by max length: 4', async () => {
    await db
      .update(preferences)
      .set({ genderPreference: 'both', countryOrigins: ['FR', 'US', 'ES'], maxCharacters: 4 })
      .where(eq(preferences.id, 1));

    const name = await nameService.getNextName(testUser.id);
    expect(name?.name.length).toBeLessThanOrEqual(4);
    expect(name?.name).toBe('Bob');
  });

  it('should respect multiple filters simultaneously', async () => {
    await db
      .update(preferences)
      .set({
        genderPreference: 'female',
        countryOrigins: ['FR'],
        maxCharacters: 10,
      })
      .where(eq(preferences.id, 1));

    const name = await nameService.getNextName(testUser.id);
    expect(name?.name).toBe('Alice');
    expect(name?.gender).toBe('female');
    expect(name?.originCountry).toBe('FR');
  });

  it('should return null when no matches found', async () => {
    await db
      .update(preferences)
      .set({
        genderPreference: 'male',
        countryOrigins: ['FR'],
        maxCharacters: 20,
      })
      .where(eq(preferences.id, 1));

    const name = await nameService.getNextName(testUser.id);
    expect(name).toBeNull();
  });

  it('should not suggest already reviewed names', async () => {
    await db
      .update(preferences)
      .set({
        genderPreference: 'both',
        countryOrigins: ['FR', 'US', 'ES'],
        maxCharacters: 20,
      })
      .where(eq(preferences.id, 1));

    const first = await nameService.getNextName(testUser.id);
    expect(first).not.toBeNull();

    await db.insert(reviews).values({
      userId: testUser.id,
      nameId: first!.id,
      isLiked: true,
    });

    const second = await nameService.getNextName(testUser.id);
    expect(second).not.toBeNull();
    expect(second!.id).not.toBe(first!.id);
  });
});
