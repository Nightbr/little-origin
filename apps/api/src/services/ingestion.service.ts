import { SUPPORTED_COUNTRIES, names } from '@little-origin/core';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../config/logger';
import { db } from '../db/client';
import { EVENTS, pubsub } from '../pubsub';

const BATCH_SIZE = 100;
const CSV_BASE_URL =
	'https://media.githubusercontent.com/media/Nightbr/little-origin/refs/heads/main/packages/name-data/data/extended-dataset';

interface IngestionState {
	country: string;
	totalNames: number;
	processedNames: number;
	currentBatch: number;
	totalBatches: number;
	filteredNames: number;
	status: 'streaming' | 'processing' | 'completed' | 'failed';
	error?: string;
}

// Character set patterns for country-specific validation
const COUNTRY_PATTERNS: Record<string, RegExp> = {
	// Latin script with common diacritics (French, Spanish, Italian, Portuguese, German, etc.)
	FR: /^[\p{L}]+$/u,
	ES: /^[\p{L}]+$/u,
	IT: /^[\p{L}]+$/u,
	DE: /^[\p{L}]+$/u,
	IE: /^[\p{L}]+$/u,
	GB: /^[\p{L}]+$/u,
	// US: Basic Latin + common accented characters found in US names
	US: /^[\p{L}]+$/u,
};

class IngestionService {
	private ingestionState = new Map<string, IngestionState>();
	private stateCleanupTimers = new Map<string, NodeJS.Timeout>();
	private lastLoggedProgress = new Map<string, number>();
	private readonly PROGRESS_LOG_INTERVAL = 10000; // Log every 10,000 names
	private readonly MIN_NAME_LENGTH = 3;
	private readonly MAX_NAME_LENGTH = 20;
	private filteredStats = new Map<string, Map<string, number>>(); // countryCode -> reason -> count

	async getIngestionStatus(): Promise<
		Array<{
			country: string;
			countryName: string;
			loadedCount: number;
			isIngesting: boolean;
			progress: IngestionState | null;
			error: string | null;
		}>
	> {
		const statusPromises = SUPPORTED_COUNTRIES.map(async (country) => {
			// Count all names for this country (regardless of source)
			const [countResult] = await db
				.select({ count: sql<number>`count(*)` })
				.from(names)
				.where(eq(names.originCountry, country.code));

			const loadedCount = countResult?.count ?? 0;
			const state = this.ingestionState.get(country.code);

			return {
				country: country.code,
				countryName: country.name,
				loadedCount,
				isIngesting: state?.status === 'streaming' || state?.status === 'processing',
				progress: state
					? {
							...state,
							country: country.code,
						}
					: null,
				error: state?.error ?? null,
			};
		});

		return Promise.all(statusPromises);
	}

	async startIngestion(countryCode: string): Promise<{ country: string; started: boolean }> {
		const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
		if (!country) {
			throw new Error(`Invalid country code: ${countryCode}`);
		}

		const existingState = this.ingestionState.get(countryCode);
		if (
			existingState &&
			(existingState.status === 'streaming' || existingState.status === 'processing')
		) {
			logger.info(`[${countryCode}] Ingestion already in progress, ignoring request`);
			return { country: countryCode, started: false };
		}

		// Clear any existing cleanup timer
		const existingTimer = this.stateCleanupTimers.get(countryCode);
		if (existingTimer) {
			clearTimeout(existingTimer);
			this.stateCleanupTimers.delete(countryCode);
		}

		// Reset progress tracking
		this.lastLoggedProgress.delete(countryCode);
		this.filteredStats.set(countryCode, new Map());

		// Initialize state
		this.ingestionState.set(countryCode, {
			country: countryCode,
			totalNames: 0,
			processedNames: 0,
			currentBatch: 0,
			totalBatches: 0,
			filteredNames: 0,
			status: 'streaming',
		});

		logger.info(`[${countryCode}] Starting CSV ingestion from ${CSV_BASE_URL}/${countryCode}.csv`);

		// Start ingestion in background
		this.ingestFromCSV(countryCode).catch((error) => {
			logger.error({ error }, `[${countryCode}] Ingestion failed`);
			const state = this.ingestionState.get(countryCode);
			if (state) {
				state.status = 'failed';
				state.error = error instanceof Error ? error.message : 'Unknown error';
				this.publishProgress(countryCode, state);
				this.scheduleStateCleanup(countryCode);
			}
		});

		return { country: countryCode, started: true };
	}

	private async ingestFromCSV(countryCode: string): Promise<void> {
		const url = `${CSV_BASE_URL}/${countryCode}.csv`;
		const state = this.ingestionState.get(countryCode);
		if (!state) throw new Error('State not initialized');

		try {
			logger.info(`[${countryCode}] Fetching CSV from ${url}`);
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch CSV: ${response.statusText}`);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			logger.info(`[${countryCode}] Starting to stream and parse CSV`);
			const decoder = new TextDecoder();
			let buffer = '';
			let batch: Array<{ name: string; gender: 'male' | 'female'; country: string }> = [];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');

				// Keep the last incomplete line in buffer
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim()) continue;

					const parsed = this.parseCSVLine(line, countryCode);
					if (parsed) {
						batch.push(parsed);
						state.totalNames++;

						// Insert batch when full
						if (batch.length >= BATCH_SIZE) {
							await this.insertBatch(batch, countryCode, state);
							batch = [];
						}
					}
				}
			}

			// Insert remaining records
			if (batch.length > 0) {
				await this.insertBatch(batch, countryCode, state);
			}

			// Mark as completed
			state.status = 'completed';
			logger.info(
				`[${countryCode}] Ingestion completed - ${state.processedNames.toLocaleString()} names processed, ${state.totalBatches.toLocaleString()} batches`,
			);
			if (state.filteredNames > 0) {
				logger.info(
					`[${countryCode}] Filtered ${state.filteredNames.toLocaleString()} invalid names`,
				);
				this.logFilteredStats(countryCode);
			}
			this.publishProgress(countryCode, state);
			this.scheduleStateCleanup(countryCode);
		} catch (error) {
			logger.error({ error }, `[${countryCode}] Error during ingestion`);
			state.status = 'failed';
			state.error = error instanceof Error ? error.message : 'Unknown error';
			this.publishProgress(countryCode, state);
			this.scheduleStateCleanup(countryCode);
			throw error;
		}
	}

	private parseCSVLine(
		line: string,
		countryCode: string,
	): { name: string; gender: 'male' | 'female'; country: string } | null {
		// CSV format: [first name, last name, gender (M/F), country code]
		const parts = line.split(',');
		if (parts.length < 3) return null;

		const firstName = parts[0]?.trim();
		const genderRaw = parts[2]?.trim().toUpperCase();

		if (!firstName) return null;
		if (genderRaw !== 'M' && genderRaw !== 'F') return null;

		// Validate name against country-specific rules
		const validationResult = this.validateName(firstName, countryCode);
		if (!validationResult.isValid) {
			this.trackFilteredName(countryCode, validationResult.reason ?? 'unknown');
			return null;
		}

		return {
			name: firstName,
			gender: genderRaw === 'M' ? 'male' : 'female',
			country: countryCode,
		};
	}

	private validateName(name: string, countryCode: string): { isValid: boolean; reason?: string } {
		// Check for empty name
		if (!name || name.length === 0) {
			return { isValid: false, reason: 'empty' };
		}

		// Check minimum length
		if (name.length < this.MIN_NAME_LENGTH) {
			return { isValid: false, reason: 'too_short' };
		}

		// Check maximum length
		if (name.length > this.MAX_NAME_LENGTH) {
			return { isValid: false, reason: 'too_long' };
		}

		// Check country-specific character patterns
		const pattern = COUNTRY_PATTERNS[countryCode];
		if (pattern && !pattern.test(name)) {
			return { isValid: false, reason: 'invalid_characters' };
		}

		return { isValid: true };
	}

	private trackFilteredName(countryCode: string, reason: string): void {
		const stats = this.filteredStats.get(countryCode);
		if (stats) {
			const current = stats.get(reason) ?? 0;
			stats.set(reason, current + 1);
		}

		const state = this.ingestionState.get(countryCode);
		if (state) {
			state.filteredNames++;
		}
	}

	private logFilteredStats(countryCode: string): void {
		const stats = this.filteredStats.get(countryCode);
		if (stats && stats.size > 0) {
			const entries = Array.from(stats.entries());
			const summary = entries
				.map(([reason, count]) => `${reason}: ${count.toLocaleString()}`)
				.join(', ');
			logger.info(`[${countryCode}] Filtered names - ${summary}`);
		}
	}

	private async insertBatch(
		batch: Array<{ name: string; gender: 'male' | 'female'; country: string }>,
		countryCode: string,
		state: IngestionState,
	): Promise<void> {
		state.status = 'processing';
		state.currentBatch++;

		const apiSource = 'extended' as const;
		await db
			.insert(names)
			.values(
				batch.map((b) => ({
					name: b.name,
					gender: b.gender,
					originCountry: b.country,
					source: apiSource,
				})),
			)
			.onConflictDoNothing();

		state.processedNames += batch.length;
		state.totalBatches = state.currentBatch;

		// Log progress milestones
		const lastLogged = this.lastLoggedProgress.get(countryCode) ?? 0;
		const shouldLogByCount =
			state.processedNames - lastLogged >= this.PROGRESS_LOG_INTERVAL || lastLogged === 0;

		if (shouldLogByCount) {
			logger.info(
				`[${countryCode}] Progress: ${state.processedNames.toLocaleString()} names processed - Batch ${state.currentBatch.toLocaleString()}`,
			);
			this.logFilteredStats(countryCode);
			this.lastLoggedProgress.set(countryCode, state.processedNames);
		}

		this.publishProgress(countryCode, state);
	}

	private publishProgress(countryCode: string, state: IngestionState): void {
		pubsub.publish(EVENTS.NAME_INGESTION_PROGRESS, {
			nameIngestionProgress: {
				country: countryCode,
				totalNames: state.totalNames,
				processedNames: state.processedNames,
				currentBatch: state.currentBatch,
				totalBatches: state.totalBatches,
			},
		});
	}

	private scheduleStateCleanup(countryCode: string): void {
		const timer = setTimeout(() => {
			this.ingestionState.delete(countryCode);
			this.stateCleanupTimers.delete(countryCode);
			this.lastLoggedProgress.delete(countryCode);
			logger.debug(`[${countryCode}] State cleared after 5 second delay`);
		}, 5000);

		this.stateCleanupTimers.set(countryCode, timer);
	}
}

export const ingestionService = new IngestionService();
