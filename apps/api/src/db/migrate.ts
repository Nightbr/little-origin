import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { logger } from '../config/logger';
import { db } from './client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migrations from the migrations folder.
 * This should be called before the server starts to ensure the database schema is up to date.
 */
export async function runMigrations(): Promise<void> {
	// Try multiple locations for migrations:
	// 1. MIGRATIONS_PATH env var (explicit override)
	// 2. Relative to current file (source location in development)
	// 3. In dist/migrations (production bundled)
	let migrationsFolder = process.env.MIGRATIONS_PATH;

	if (!migrationsFolder) {
		const srcMigrations = path.join(__dirname, 'migrations');
		const distMigrations = path.join(process.cwd(), 'dist', 'migrations');

		if (existsSync(srcMigrations)) {
			migrationsFolder = srcMigrations;
		} else if (existsSync(distMigrations)) {
			migrationsFolder = distMigrations;
		} else {
			migrationsFolder = distMigrations; // Fallback, will error with helpful message
		}
	}

	logger.info('🔄 Running database migrations...');

	try {
		migrate(db, { migrationsFolder });
		logger.info('✅ Database migrations complete');
	} catch (error) {
		logger.error({ err: error, migrationsFolder }, '❌ Migration failed');
		throw error;
	}
}
