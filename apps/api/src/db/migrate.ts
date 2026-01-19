import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client';
import path from 'path';

/**
 * Run database migrations from the migrations folder.
 * This should be called before the server starts to ensure the database schema is up to date.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.join(__dirname, 'migrations');

  console.log('🔄 Running database migrations...');

  try {
    migrate(db, { migrationsFolder });
    console.log('✅ Database migrations complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
