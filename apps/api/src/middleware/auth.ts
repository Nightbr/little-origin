import { users } from '@little-origin/core';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { db } from '../db/client';
import { verifyToken } from '../utils/jwt';

export interface AuthContext {
	user: typeof users.$inferSelect | null;
}

export async function getUserFromToken(token: string): Promise<typeof users.$inferSelect | null> {
	const payload = verifyToken(token);
	if (!payload) return null;

	const result = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
	return result[0] || null;
}

export async function getUserFromRequest(req: Request): Promise<typeof users.$inferSelect | null> {
	const authHeader = req.headers.authorization;
	if (!authHeader) return null;

	const token = authHeader.split(' ')[1]; // Bearer <token>
	if (!token) return null;

	return getUserFromToken(token);
}
