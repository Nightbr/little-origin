import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// --- ENUMS & HELPERS ---
export const GENDER_ENUM = ['male', 'female'] as const;
export const GENDER_PREF_ENUM = ['male', 'female', 'both'] as const;
export const NAME_SOURCE_ENUM = ['api', 'llm', 'seed', 'static'] as const;

// --- TABLES ---

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const preferences = sqliteTable('preferences', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	countryOrigins: text('country_origins', { mode: 'json' }).$type<string[]>().notNull(),
	genderPreference: text('gender_preference', { enum: GENDER_PREF_ENUM }).notNull(),
	maxCharacters: integer('max_characters').notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const names = sqliteTable(
	'names',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		gender: text('gender', { enum: GENDER_ENUM }).notNull(),
		originCountry: text('origin_country').notNull(),
		source: text('source', { enum: NAME_SOURCE_ENUM }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => ({
		uniqueNameGender: unique().on(t.name, t.gender),
		countryIdx: index('idx_names_country').on(t.originCountry),
	}),
);

export const reviews = sqliteTable(
	'reviews',
	{
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
	},
	(t) => ({
		uniqueUserReview: unique().on(t.userId, t.nameId),
		userIdx: index('idx_reviews_user').on(t.userId),
	}),
);

export const matches = sqliteTable('matches', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nameId: integer('name_id')
		.notNull()
		.references(() => names.id, { onDelete: 'cascade' })
		.unique(),
	userCount: integer('user_count').notNull(),
	matchedAt: integer('matched_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const appSettings = sqliteTable('app_settings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' })
		.notNull()
		.default(false),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
});

// --- RELATIONS ---

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

// --- ZOD SCHEMAS ---

export const insertUserSchema = createInsertSchema(users, {
	username: z
		.string()
		.min(3)
		.max(30)
		.regex(/^[a-zA-Z0-9_]+$/),
	passwordHash: z.string(),
}).omit({ id: true, createdAt: true });

export const selectUserSchema = createSelectSchema(users);

export const insertPreferencesSchema = createInsertSchema(preferences).omit({
	id: true,
	updatedAt: true,
});
export const selectPreferencesSchema = createSelectSchema(preferences);

export const insertNameSchema = createInsertSchema(names).omit({ id: true, createdAt: true });
export const selectNameSchema = createSelectSchema(names);

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, reviewedAt: true });
export const selectReviewSchema = createSelectSchema(reviews);

export const selectMatchSchema = createSelectSchema(matches);

// --- TYPES ---

export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Preferences = z.infer<typeof selectPreferencesSchema>;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;

export type Name = z.infer<typeof selectNameSchema>;
export type InsertName = z.infer<typeof insertNameSchema>;

export type Review = z.infer<typeof selectReviewSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Match = z.infer<typeof selectMatchSchema>;
