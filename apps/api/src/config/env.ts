import path from 'node:path';
import dotenv from 'dotenv';
import z from 'zod';

// Load from .env file - try multiple locations
// In development, the .env is at the monorepo root
// In production/Docker, environment variables should be set directly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '..', '.env') });

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.string().default('3000'),
	JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 chars'),
	DATABASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
