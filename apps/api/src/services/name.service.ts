import {
	DEFAULT_PREFERENCES,
	SUPPORTED_COUNTRIES,
	names,
	preferences,
	reviews,
} from '@little-origin/core';
import { getNamesByCountries } from '@little-origin/name-data';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { db } from '../db/client';

class NameService {
	private static readonly BATCH_SIZE = 100;

	/**
	 * Seed all names from all available countries.
	 * Inserts in batches to avoid SQLite limits.
	 */
	async seedNames() {
		// Get preferences (singleton) - only used for gender/maxCharacters
		const prefsList = await db.select().from(preferences).limit(1);
		const prefs = prefsList[0] || DEFAULT_PREFERENCES;

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
		// Get preferences
		const prefsList = await db.select().from(preferences).limit(1);
		const prefs = prefsList[0] || DEFAULT_PREFERENCES;

		// Subquery: names reviewed by user
		const reviewedIdsQuery = db
			.select({ nameId: reviews.nameId })
			.from(reviews)
			.where(eq(reviews.userId, userId));

		// Build filters
		const filters = [notInArray(names.id, reviewedIdsQuery)];

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
			.limit(1);

		return result[0] || null;
	}
}

export const nameService = new NameService();
