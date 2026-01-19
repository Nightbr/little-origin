# Database Schema

Complete database schema definitions using Drizzle ORM with Zod validation and TypeScript types.

---

## Overview

**Single Source of Truth Pattern:**
```
Drizzle Schema → Zod Validation → TypeScript Types
```

**Location:** `packages/core/src/db/schema.ts`

**Benefits:**
- ✅ Define once, use everywhere
- ✅ Runtime validation (Zod)
- ✅ Compile-time safety (TypeScript)
- ✅ No type drift
- ✅ Auto-generated migrations

---

## Complete Schema Definition

```typescript
// packages/core/src/db/schema.ts

import { sqliteTable, integer, text, unique, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  usernameIdx: index('users_username_idx').on(table.username),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric'),
  passwordHash: z.string(),
  createdAt: z.date().optional(),
}).omit({ id: true });

export const selectUserSchema = createSelectSchema(users);

// Registration schema (includes plain password before hashing)
export const registerUserSchema = insertUserSchema
  .omit({ passwordHash: true })
  .extend({
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be at most 100 characters'),
  });

// TypeScript types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;

// ============================================================================
// PREFERENCES TABLE (Singleton)
// ============================================================================

export const preferences = sqliteTable('preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  countryOrigins: text('country_origins', { mode: 'json' })
    .$type<string[]>()
    .notNull(),
  genderPreference: text('gender_preference')
    .notNull()
    .$type<'male' | 'female' | 'both'>(),
  maxCharacters: integer('max_characters').notNull().default(12),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const insertPreferencesSchema = createInsertSchema(preferences, {
  countryOrigins: z.array(z.string().length(2, 'Must be ISO country code'))
    .min(1, 'Select at least one country')
    .max(10, 'Maximum 10 countries'),
  genderPreference: z.enum(['male', 'female', 'both']),
  maxCharacters: z.number()
    .int()
    .min(3, 'Minimum 3 characters')
    .max(20, 'Maximum 20 characters'),
  updatedAt: z.date().optional(),
}).omit({ id: true });

export const selectPreferencesSchema = createSelectSchema(preferences);

export type Preferences = z.infer<typeof selectPreferencesSchema>;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;

// ============================================================================
// NAMES TABLE
// ============================================================================

export const names = sqliteTable('names', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  gender: text('gender').notNull().$type<'male' | 'female'>(),
  originCountry: text('origin_country').notNull(),
  source: text('source').notNull().$type<'api' | 'llm' | 'seed' | 'static'>(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  // Same name can exist for different genders
  uniqueNameGender: unique('unique_name_gender').on(table.name, table.gender),
  genderIdx: index('names_gender_idx').on(table.gender),
  originIdx: index('names_origin_idx').on(table.originCountry),
  sourceIdx: index('names_source_idx').on(table.source),
}));

export const insertNameSchema = createInsertSchema(names, {
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name must contain only letters'),
  gender: z.enum(['male', 'female']),
  originCountry: z.string().length(2, 'Must be ISO country code'),
  source: z.enum(['api', 'llm', 'seed', 'static']),
  createdAt: z.date().optional(),
}).omit({ id: true });

export const selectNameSchema = createSelectSchema(names);

export type Name = z.infer<typeof selectNameSchema>;
export type InsertName = z.infer<typeof insertNameSchema>;

// ============================================================================
// REVIEWS TABLE
// ============================================================================

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  nameId: integer('name_id')
    .notNull()
    .references(() => names.id, { onDelete: 'cascade' }),
  isLiked: integer('is_liked', { mode: 'boolean' }).notNull(),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  // User can only review a name once
  uniqueUserName: unique('unique_user_name').on(table.userId, table.nameId),
  userIdIdx: index('reviews_user_id_idx').on(table.userId),
  nameIdIdx: index('reviews_name_id_idx').on(table.nameId),
  isLikedIdx: index('reviews_is_liked_idx').on(table.isLiked),
  reviewedAtIdx: index('reviews_reviewed_at_idx').on(table.reviewedAt),
}));

export const insertReviewSchema = createInsertSchema(reviews, {
  userId: z.number().int().positive(),
  nameId: z.number().int().positive(),
  isLiked: z.boolean(),
  reviewedAt: z.date().optional(),
}).omit({ id: true });

export const selectReviewSchema = createSelectSchema(reviews);

export type Review = z.infer<typeof selectReviewSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// ============================================================================
// MATCHES TABLE
// ============================================================================

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nameId: integer('name_id')
    .notNull()
    .references(() => names.id, { onDelete: 'cascade' })
    .unique(),
  userCount: integer('user_count').notNull().default(2),
  matchedAt: integer('matched_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  nameIdIdx: index('matches_name_id_idx').on(table.nameId),
  userCountIdx: index('matches_user_count_idx').on(table.userCount),
}));

export const insertMatchSchema = createInsertSchema(matches, {
  nameId: z.number().int().positive(),
  userCount: z.number().int().min(2, 'Match requires at least 2 users'),
  matchedAt: z.date().optional(),
}).omit({ id: true });

export const selectMatchSchema = createSelectSchema(matches);

export type Match = z.infer<typeof selectMatchSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// ============================================================================
// RELATIONS (for Drizzle Relational Queries)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
}));

export const namesRelations = relations(names, ({ many, one }) => ({
  reviews: many(reviews),
  match: one(matches, {
    fields: [names.id],
    references: [matches.nameId],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  name: one(names, {
    fields: [reviews.nameId],
    references: [names.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  name: one(names, {
    fields: [matches.nameId],
    references: [names.id],
  }),
}));

// ============================================================================
// EXPORT SCHEMAS
// ============================================================================

export const schemas = {
  // Insert schemas (for creation)
  insertUser: insertUserSchema,
  insertPreferences: insertPreferencesSchema,
  insertName: insertNameSchema,
  insertReview: insertReviewSchema,
  insertMatch: insertMatchSchema,
  
  // Select schemas (for reading)
  selectUser: selectUserSchema,
  selectPreferences: selectPreferencesSchema,
  selectName: selectNameSchema,
  selectReview: selectReviewSchema,
  selectMatch: selectMatchSchema,
  
  // Special schemas
  registerUser: registerUserSchema,
};
```

---

## Database Client Setup

```typescript
// apps/api/src/db/client.ts

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@little-origin/core';

const DATABASE_URL = process.env.DATABASE_URL || './data/database.db';

const sqlite = new Database(DATABASE_URL);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
```

---

## Usage Examples

### 1. Creating a User (with Validation)

```typescript
import { db } from './db/client';
import { users, schemas } from '@little-origin/core';
import { hashPassword } from './utils/password';

async function createUser(input: unknown) {
  // Validate input with Zod
  const { username, password } = schemas.registerUser.parse(input);
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Insert with validation
  const [user] = await db.insert(users)
    .values({ username, passwordHash })
    .returning();
  
  return user; // TypeScript knows this is User type
}
```

### 2. Setting Preferences

```typescript
import { db } from './db/client';
import { preferences, schemas } from '@little-origin/core';

async function setPreferences(input: unknown) {
  // Validate input
  const validated = schemas.insertPreferences.parse(input);
  
  // Upsert preferences (singleton table)
  const [prefs] = await db.insert(preferences)
    .values(validated)
    .onConflictDoUpdate({
      target: preferences.id,
      set: {
        ...validated,
        updatedAt: new Date(),
      },
    })
    .returning();
  
  return prefs;
}
```

### 3. Creating a Review

```typescript
import { db } from './db/client';
import { reviews, schemas } from '@little-origin/core';
import { eq, and } from 'drizzle-orm';

async function createReview(userId: number, nameId: number, isLiked: boolean) {
  // Validate input
  const validated = schemas.insertReview.parse({
    userId,
    nameId,
    isLiked,
  });
  
  // Insert (will fail if duplicate due to UNIQUE constraint)
  const [review] = await db.insert(reviews)
    .values(validated)
    .returning();
  
  return review;
}
```

### 4. Relational Queries

```typescript
import { db } from './db/client';
import { users } from '@little-origin/core';
import { eq } from 'drizzle-orm';

// Get user with all their reviews
const userWithReviews = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    reviews: {
      with: {
        name: true, // Include name details
      },
    },
  },
});

// TypeScript infers the full nested type
userWithReviews?.reviews[0]?.name?.name // string
```

### 5. Complex Queries

```typescript
import { db } from './db/client';
import { reviews, names } from '@little-origin/core';
import { eq, and, count, desc } from 'drizzle-orm';

// Get all matches (names with 2+ likes)
const matches = await db
  .select({
    name: names,
    likeCount: count(reviews.id),
  })
  .from(names)
  .innerJoin(reviews, and(
    eq(reviews.nameId, names.id),
    eq(reviews.isLiked, true)
  ))
  .groupBy(names.id)
  .having(({ likeCount }) => likeCount >= 2)
  .orderBy(desc(count(reviews.id)));
```

---

## Migrations

### Drizzle Kit Configuration

```typescript
// apps/api/drizzle.config.ts

import type { Config } from 'drizzle-kit';

export default {
  schema: '../packages/core/src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/database.db',
  },
} satisfies Config;
```

### Generate Migrations

```bash
# Generate migration from schema changes
pnpm --filter @little-origin/api db:generate

# Apply migrations
pnpm --filter @little-origin/api db:migrate

# Open Drizzle Studio (GUI)
pnpm --filter @little-origin/api db:studio
```

### Initial Migration

```sql
-- src/db/migrations/0000_init.sql

CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `username` text NOT NULL,
  `password_hash` text NOT NULL,
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
CREATE INDEX `users_username_idx` ON `users` (`username`);

CREATE TABLE `preferences` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `country_origins` text NOT NULL,
  `gender_preference` text NOT NULL,
  `max_characters` integer DEFAULT 12 NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `names` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `gender` text NOT NULL,
  `origin_country` text NOT NULL,
  `source` text NOT NULL,
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX `unique_name_gender` ON `names` (`name`, `gender`);
CREATE INDEX `names_gender_idx` ON `names` (`gender`);
CREATE INDEX `names_origin_idx` ON `names` (`origin_country`);
CREATE INDEX `names_source_idx` ON `names` (`source`);

CREATE TABLE `reviews` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL,
  `name_id` integer NOT NULL,
  `is_liked` integer NOT NULL,
  `reviewed_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
  FOREIGN KEY (`name_id`) REFERENCES `names`(`id`) ON DELETE cascade
);

CREATE UNIQUE INDEX `unique_user_name` ON `reviews` (`user_id`, `name_id`);
CREATE INDEX `reviews_user_id_idx` ON `reviews` (`user_id`);
CREATE INDEX `reviews_name_id_idx` ON `reviews` (`name_id`);
CREATE INDEX `reviews_is_liked_idx` ON `reviews` (`is_liked`);
CREATE INDEX `reviews_reviewed_at_idx` ON `reviews` (`reviewed_at`);

CREATE TABLE `matches` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name_id` integer NOT NULL,
  `user_count` integer DEFAULT 2 NOT NULL,
  `matched_at` integer NOT NULL,
  FOREIGN KEY (`name_id`) REFERENCES `names`(`id`) ON DELETE cascade
);

CREATE UNIQUE INDEX `matches_name_id_unique` ON `matches` (`name_id`);
CREATE INDEX `matches_name_id_idx` ON `matches` (`name_id`);
CREATE INDEX `matches_user_count_idx` ON `matches` (`user_count`);
```

---

## Constraints & Indexes

### Unique Constraints

1. **users.username** - No duplicate usernames
2. **(names.name, names.gender)** - Same name can exist for different genders
3. **(reviews.userId, reviews.nameId)** - User can only review a name once
4. **matches.nameId** - One match per name

### Indexes for Performance

1. **users**
   - `username` - Fast username lookups (login)

2. **names**
   - `gender` - Filter by gender
   - `originCountry` - Filter by country
   - `source` - Track name sources

3. **reviews**
   - `userId` - Get all reviews by user
   - `nameId` - Get all reviews for a name
   - `isLiked` - Filter likes/dislikes
   - `reviewedAt` - Order by time (for undo)

4. **matches**
   - `nameId` - Fast match lookups
   - `userCount` - Order by popularity

---

## Data Integrity

### Foreign Key Constraints

All foreign keys use `CASCADE DELETE`:
- Delete user → Delete their reviews
- Delete name → Delete reviews + match

### Database Pragmas (SQLite)

```typescript
// apps/api/src/db/client.ts

sqlite.pragma('journal_mode = WAL');  // Write-Ahead Logging
sqlite.pragma('foreign_keys = ON');   // Enable FK constraints
sqlite.pragma('synchronous = NORMAL'); // Performance/safety balance
```

---

## Testing

### In-Memory Database for Tests

```typescript
// apps/api/src/db/client.test.ts

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@little-origin/core';

export function createTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  
  // Run migrations
  migrate(db, { migrationsFolder: './src/db/migrations' });
  
  return { db, sqlite };
}

// Usage in tests
describe('User Service', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: ReturnType<typeof createTestDb>['sqlite'];
  
  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
  });
  
  afterEach(() => {
    sqlite.close();
  });
  
  it('should create a user', async () => {
    const user = await createUser({ username: 'alice', password: 'pass123' });
    expect(user.username).toBe('alice');
  });
});
```

---

## Summary

**Single Source of Truth:**
```typescript
// Define once in Drizzle
export const users = sqliteTable('users', { ... });

// Auto-generate Zod schema
export const insertUserSchema = createInsertSchema(users, { ... });

// Auto-infer TypeScript type
export type User = z.infer<typeof selectUserSchema>;
```

**Benefits:**
- ✅ No manual type definitions
- ✅ Runtime validation included
- ✅ Database schema = API contract
- ✅ Migrations auto-generated
- ✅ Type-safe queries
- ✅ Easy to maintain

**Next Steps:**
- See [GRAPHQL.md](./GRAPHQL.md) for API schema
- See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for setup
- See [FEATURES.md](./FEATURES.md) for business logic