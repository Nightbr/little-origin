import z from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load from .env file in root or api
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.string().default('3000'),
	JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 chars'),
	DATABASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
