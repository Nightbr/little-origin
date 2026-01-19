export const MAX_USERS = 10;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 100;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;

export const SUPPORTED_COUNTRIES = [
	{ code: 'US', name: 'United States' },
	{ code: 'GB', name: 'United Kingdom' },
	{ code: 'FR', name: 'France' },
	{ code: 'IT', name: 'Italy' },
	{ code: 'DE', name: 'Germany' },
	{ code: 'ES', name: 'Spain' },
	{ code: 'IE', name: 'Ireland' },
] as const;

export const DEFAULT_PREFERENCES = {
	countryOrigins: ['US'] as string[],
	genderPreference: 'both' as const,
	maxCharacters: 20,
};
