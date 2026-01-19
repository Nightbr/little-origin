import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
	userId: number;
}

// Access token - short-lived (15 minutes), stored in memory on client
const ACCESS_TOKEN_EXPIRY = '15m';

// Refresh token - long-lived (7 days), stored in HTTP-only cookie
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateAccessToken(userId: number): string {
	return jwt.sign({ userId, type: 'access' }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(userId: number): string {
	return jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// Legacy function for backward compatibility
export function generateToken(userId: number): string {
	return generateAccessToken(userId);
}

export function verifyToken(token: string): TokenPayload | null {
	try {
		return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
	} catch {
		return null;
	}
}

export function verifyRefreshToken(token: string): TokenPayload | null {
	try {
		const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload & { type?: string };
		// Ensure it's a refresh token (or legacy token without type)
		if (payload.type && payload.type !== 'refresh') {
			return null;
		}
		return payload;
	} catch {
		return null;
	}
}

// Cookie options for refresh token
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
	path: '/',
};
