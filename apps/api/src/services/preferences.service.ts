import { DEFAULT_PREFERENCES, insertPreferencesSchema, preferences } from '@little-origin/core';
import { db } from '../db/client';

class PreferencesService {
	async getPreferences() {
		const res = await db.select().from(preferences).limit(1);
		return (res[0] as typeof DEFAULT_PREFERENCES) || DEFAULT_PREFERENCES;
	}

	async setPreferences(input: unknown) {
		const validated = insertPreferencesSchema.parse(input);

		// Convert validated data to ensure proper types for Drizzle
		const values = {
			countryOrigins: Array.isArray(validated.countryOrigins)
				? [...validated.countryOrigins]
				: validated.countryOrigins,
			genderPreference: validated.genderPreference,
			maxCharacters: validated.maxCharacters,
			familyName: validated.familyName ?? '',
		} as const;

		// We use a singleton with ID 1
		const [result] = await db
			.insert(preferences)
			.values({ ...values, id: 1 })
			.onConflictDoUpdate({
				target: preferences.id,
				set: { ...values, updatedAt: new Date() },
			})
			.returning();

		return result as typeof DEFAULT_PREFERENCES;
	}
}

export const preferencesService = new PreferencesService();
