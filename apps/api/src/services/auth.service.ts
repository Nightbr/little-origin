import { db } from '../db/client';
import { users, insertUserSchema } from '@little-origin/core';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import type { InsertUser } from '@little-origin/core';
import { eq, count } from 'drizzle-orm';
import { MAX_USERS } from '@little-origin/core';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(input: InsertUser): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
    // 1. Validate Limit
    const userCount = await db.select({ count: count() }).from(users);
    if (userCount[0].count >= MAX_USERS) {
      throw new Error(`Maximum user limit of ${MAX_USERS} reached.`);
    }

    // 2. Validate Input
    const validated = insertUserSchema.parse(input);

    // 3. Check existing
    const existing = await db.select().from(users).where(eq(users.username, validated.username));
    if (existing.length > 0) {
      throw new Error('Username already taken');
    }

    // 4. Hash Password
    const passwordHash = await hashPassword(validated.passwordHash);

    // 5. Create
    const [user] = await db
      .insert(users)
      .values({
        ...validated,
        passwordHash,
      })
      .returning();

    // 6. Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { user, tokens: { accessToken, refreshToken } };
  }

  async login(username: string, password: string): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
    const [user] = await db.select().from(users).where(eq(users.username, username));

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { user, tokens: { accessToken, refreshToken } };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ user: typeof users.$inferSelect; accessToken: string }> {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = generateAccessToken(user.id);
    return { user, accessToken };
  }
}

export const authService = new AuthService();
