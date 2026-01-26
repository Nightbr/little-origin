import { insertUserSchema, users } from '@little-origin/core';
import type { InsertUser } from '@little-origin/core';
import { MAX_USERS } from '@little-origin/core';
import { count, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';

interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

class AuthService {
	async register(
		input: InsertUser,
	): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
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

	async login(
		username: string,
		password: string,
	): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
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

	async refreshAccessToken(
		refreshToken: string,
	): Promise<{ user: typeof users.$inferSelect; accessToken: string }> {
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

	async deleteUser(userId: number, _requestingUserId: number): Promise<void> {
		// Prevent deleting last user
		const userCount = await db.select({ count: count() }).from(users);
		if (userCount[0].count <= 1) {
			throw new Error('Cannot delete the last user');
		}

		// Verify user exists
		const [userToDelete] = await db.select().from(users).where(eq(users.id, userId));
		if (!userToDelete) {
			throw new Error('User not found');
		}

		// Delete user (reviews cascade automatically via schema)
		await db.delete(users).where(eq(users.id, userId));
	}
}

export const authService = new AuthService();
