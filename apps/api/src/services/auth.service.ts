import { users } from '@little-origin/core';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { verifyPassword } from '../utils/password';

interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

class AuthService {
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
}

export const authService = new AuthService();
