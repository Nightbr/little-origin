import { insertUserSchema, users } from '@little-origin/core';
import { MAX_USERS } from '@little-origin/core';
import { count, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { hashPassword } from '../utils/password';

class MemberService {
	async addMember(username: string, password: string): Promise<{ id: number; username: string }> {
		// 1. Validate Limit
		const userCount = await db.select({ count: count() }).from(users);
		if (userCount[0].count >= MAX_USERS) {
			throw new Error(`Maximum user limit of ${MAX_USERS} reached.`);
		}

		// 2. Validate Input
		const validated = insertUserSchema.parse({ username, passwordHash: password });

		// 3. Check existing
		const existing = await db.select().from(users).where(eq(users.username, validated.username));
		if (existing.length > 0) {
			throw new Error('Username already taken');
		}

		// 4. Hash Password
		const passwordHash = await hashPassword(validated.passwordHash);

		// 5. Create user (no tokens generated)
		const [user] = await db
			.insert(users)
			.values({
				...validated,
				passwordHash,
			})
			.returning();

		return { id: user.id, username: user.username };
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

export const memberService = new MemberService();
