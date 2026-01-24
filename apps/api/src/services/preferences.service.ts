import { DEFAULT_PREFERENCES, insertPreferencesSchema, preferences } from '@little-origin/core';
import { db } from '../db/client';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class PreferencesService {
	private cache: Map<string, { value: typeof DEFAULT_PREFERENCES; expires: number }> = new Map();

	private getCacheKey(): string {
		// Preferences are singleton (ID = 1), so cache key is simple
		return 'preferences:1';
	}

	private getCached(): typeof DEFAULT_PREFERENCES | null {
		const key = this.getCacheKey();
		const cached = this.cache.get(key);
		if (!cached) return null;

		if (Date.now() > cached.expires) {
			this.cache.delete(key);
			return null;
		}

		return cached.value;
	}

	private setCached(value: typeof DEFAULT_PREFERENCES): void {
		const key = this.getCacheKey();
		this.cache.set(key, {
			value,
			expires: Date.now() + CACHE_TTL,
		});
	}

	private invalidateCache(): void {
		const key = this.getCacheKey();
		this.cache.delete(key);
	}

	async getPreferences() {
		// Check cache first
		const cached = this.getCached();
		if (cached) {
			return cached;
		}

		const res = await db.select().from(preferences).limit(1);
		const result = (res[0] as typeof DEFAULT_PREFERENCES) || DEFAULT_PREFERENCES;

		// Cache the result
		this.setCached(result);

		return result;
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

		// Invalidate cache on update
		this.invalidateCache();

		return result as typeof DEFAULT_PREFERENCES;
	}

	/**
	 * Clear cached preferences. Useful for testing or when preferences
	 * are updated outside of the service layer.
	 */
	clearCache(): void {
		this.invalidateCache();
	}
}

export const preferencesService = new PreferencesService();
