import { db } from '../db/client';
import { users, insertUserSchema } from '@little-origin/core';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { User, type InsertUser } from '@little-origin/core';
import { eq, count } from 'drizzle-orm';
import { MAX_USERS } from '@little-origin/core';

export class AuthService {
	async register(input: InsertUser) {
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

		// 6. Token
		const token = generateToken(user.id);

		return { user, token };
	}

	async login(username: string, password: string) {
		const [user] = await db.select().from(users).where(eq(users.username, username));

		if (!user) {
			throw new Error('Invalid credentials');
		}

		const valid = await verifyPassword(password, user.passwordHash);
		if (!valid) {
			throw new Error('Invalid credentials');
		}

		const token = generateToken(user.id);

		return { user, token };
	}
}

export const authService = new AuthService();
