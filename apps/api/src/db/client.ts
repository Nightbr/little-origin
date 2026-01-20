import fs from 'node:fs';
import path from 'node:path';
import * as schema from '@little-origin/core';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '../config/env';
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

console.log(`📂 Using database at: ${dbPath}`);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
