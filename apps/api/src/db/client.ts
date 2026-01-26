import fs from 'node:fs';
import path from 'node:path';
import * as schema from '@little-origin/core';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { findProjectRoot } from './utils';

function getDatabasePath(): string {
	// Support in-memory database for tests
	if (env.DATABASE_URL === ':memory:') {
		return ':memory:';
	}

	if (env.DATABASE_URL) {
		return path.resolve(process.cwd(), env.DATABASE_URL);
	}

	const root = findProjectRoot();
	const dataDir = path.join(root, '.data');

	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}

	return path.join(dataDir, 'database.db');
}

const dbPath = getDatabasePath();

// Only create directories for file-based databases
if (dbPath !== ':memory:') {
	const dir = path.dirname(dbPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

logger.info(`📂 Using database at: ${dbPath}`);

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read/write access
sqlite.pragma('journal_mode = WAL');

// Enable foreign key constraints for cascade deletes
sqlite.pragma('foreign_keys = ON');

// Slow query logging configuration
const SLOW_QUERY_THRESHOLD = 50; // ms

// Wrap the prepare method to log slow queries
const originalPrepare = sqlite.prepare.bind(sqlite);
(sqlite.prepare as unknown) = (sql: string) => {
	const stmt = originalPrepare(sql);

	// Wrap the execution methods
	const run = stmt.run.bind(stmt);
	const all = stmt.all.bind(stmt);
	const get = stmt.get.bind(stmt);

	const logIfSlow = (fn: () => unknown, operation: string): unknown => {
		const start = performance.now();
		const result = fn();
		const duration = performance.now() - start;
		if (duration > SLOW_QUERY_THRESHOLD) {
			logger.warn(
				`⚠️ Slow query (${duration.toFixed(2)}ms) [${operation}]: ${sql.slice(0, 100)}${sql.length > 100 ? '...' : ''}`,
			);
		}
		return result;
	};

	return Object.assign(stmt, {
		// biome-ignore lint/suspicious/noExplicitAny: Wrapper function needs flexible typing
		run: (...args: unknown[]) => logIfSlow(() => (run as any)(...args), 'run'),
		// biome-ignore lint/suspicious/noExplicitAny: Wrapper function needs flexible typing
		all: (...args: unknown[]) => logIfSlow(() => (all as any)(...args), 'all'),
		// biome-ignore lint/suspicious/noExplicitAny: Wrapper function needs flexible typing
		get: (...args: unknown[]) => logIfSlow(() => (get as any)(...args), 'get'),
	});
};

export const db = drizzle(sqlite, { schema });
