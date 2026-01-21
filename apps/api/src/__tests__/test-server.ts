import type { Express } from 'express';
import { createHttpServer } from '../server';

export const createTestApp = async (): Promise<Express> => {
	const { app } = await createHttpServer();
	return app;
};
