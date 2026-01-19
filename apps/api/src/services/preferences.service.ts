import { DEFAULT_PREFERENCES, insertPreferencesSchema, preferences } from '@little-origin/core';
import { db } from '../db/client';

export class PreferencesService {
	async getPreferences() {
		const res = await db.select().from(preferences).limit(1);
		return res[0] || DEFAULT_PREFERENCES;
	}

	async setPreferences(input: unknown) {
		const validated = insertPreferencesSchema.parse(input);

		// We use a singleton with ID 1
		const [result] = await db
			.insert(preferences)
			.values({ ...validated, id: 1 })
			.onConflictDoUpdate({
				target: preferences.id,
				set: { ...validated, updatedAt: new Date() },
			})
			.returning();

		return result;
	}
}

export const preferencesService = new PreferencesService();
