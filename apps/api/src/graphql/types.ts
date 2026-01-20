import type { Request, Response } from 'express';
import type { db } from '../db/client';

export interface User {
	id: number;
	username: string;
}

export interface GraphQLContext {
	user: User | null;
	res: Response;
	req: Request;
	db: typeof db;
}
