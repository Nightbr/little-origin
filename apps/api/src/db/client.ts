import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { env } from '../config/env';
import * as schema from '@little-origin/core';
import path from 'path';
import fs from 'fs';
import { findProjectRoot } from './utils';

export function getDatabasePath(): string {
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
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
console.log(`📂 Using database at: ${dbPath}`);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
