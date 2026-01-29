import { SUPPORTED_COUNTRIES, names, reviews, matches } from '@little-origin/core';
import { getNamesByCountries } from '@little-origin/name-data';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { preferencesService } from './preferences.service';

class NameService {
	private static readonly BATCH_SIZE = 100;

	/**
	 * Seed all names from all available countries.
	 * Inserts in batches to avoid SQLite limits.
	 */
	async seedNames() {
		// Get preferences (singleton) - only used for gender/maxCharacters
		const prefs = await preferencesService.getPreferences();

		// Load static names for ALL countries
		const allCountryCodes = SUPPORTED_COUNTRIES.map((c) => c.code);
		const staticNames = getNamesByCountries(
			allCountryCodes,
			prefs.genderPreference,
			prefs.maxCharacters,
		);

		if (staticNames.length === 0) {
			return { count: 0, total: 0, source: 'static' };
		}

		// Prepare all values for insertion
		const allValues = staticNames.map((n) => ({
			name: n.name,
			gender: n.gender,
			originCountry: n.country,
			source: 'static' as const,
		}));

		// Insert in batches to avoid SQLite variable limits
		let insertedCount = 0;
		const totalNames = allValues.length;

		for (let i = 0; i < totalNames; i += NameService.BATCH_SIZE) {
			const batch = allValues.slice(i, i + NameService.BATCH_SIZE);
			const res = await db.insert(names).values(batch).onConflictDoNothing().returning();
			insertedCount += res.length;
		}

		return { count: insertedCount, total: totalNames, source: 'static' };
	}

	async getNextName(userId: number) {
		const result = await this.getNextNames(userId, 1);
		return result[0] || null;
	}

	async getNextNames(userId: number, limit = 2, excludeIds: number[] = []) {
		// Get preferences (cached!)
		const prefs = await preferencesService.getPreferences();

		// Subquery: names reviewed by user
		const reviewedIdsQuery = db
			.select({ nameId: reviews.nameId })
			.from(reviews)
			.where(eq(reviews.userId, userId));

		// Build filters
		const filters = [notInArray(names.id, reviewedIdsQuery)];

		// Exclude names already in client queue
		if (excludeIds.length > 0) {
			filters.push(notInArray(names.id, excludeIds));
		}

		if (prefs.genderPreference !== 'both') {
			filters.push(eq(names.gender, prefs.genderPreference as 'male' | 'female'));
		}

		if (prefs.countryOrigins && prefs.countryOrigins.length > 0) {
			filters.push(inArray(names.originCountry, prefs.countryOrigins));
		}

		if (prefs.maxCharacters) {
			filters.push(sql`length(${names.name}) <= ${prefs.maxCharacters}`);
		}

		const result = await db
			.select()
			.from(names)
			.where(and(...filters))
			.orderBy(sql`RANDOM()`)
			.limit(limit);

		return result;
	}

	async pruneExtendedNames() {
		// Delete names where source is 'extended' 
		// AND the name is NOT used in the matches table
		// AND the name is NOT used in the reviews table (liked or disliked)
		const result = await db.delete(names).where(
			and(
				eq(names.source, 'extended'),
				notInArray(
					names.id,
					db.select({ nameId: matches.nameId }).from(matches)
				),
				notInArray(
					names.id,
					db.select({ nameId: reviews.nameId }).from(reviews).where(eq(reviews.isLiked, true))
				)
			)
		).returning({ id: names.id });

		return result.length;
	}
}

export const nameService = new NameService();
