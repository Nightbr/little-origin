import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
	userId: number;
}

export function generateToken(userId: number): string {
	return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
	try {
		return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
	} catch (error) {
		return null;
	}
}
