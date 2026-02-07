export interface IngestionProgressData {
	country: string;
	totalNames: number;
	processedNames: number;
	currentBatch: number;
	totalBatches: number;
}

export interface CountryStatus {
	country: string;
	countryName: string;
	loadedCount: number;
	isIngesting: boolean;
	progress: IngestionProgressData | null;
	error: string | null;
}

export type StatusType = 'ready' | 'processing' | 'completed' | 'failed';

export function getStatus(isIngesting: boolean, error: string | null): StatusType {
	if (error) return 'failed';
	if (isIngesting) return 'processing';
	return 'ready';
}

export interface StatusBadgeVariant {
	bg: string;
	text: string;
	label: string;
}

export const STATUS_BADGE_VARIANTS: Record<StatusType, StatusBadgeVariant> = {
	ready: {
		bg: 'bg-calm-ivory',
		text: 'text-charcoal',
		label: 'Ready',
	},
	processing: {
		bg: 'bg-primary/10',
		text: 'text-primary',
		label: 'Processing',
	},
	completed: {
		bg: 'bg-sage-green/10',
		text: 'text-sage-green',
		label: 'Completed',
	},
	failed: {
		bg: 'bg-destructive/10',
		text: 'text-destructive',
		label: 'Failed',
	},
} as const;
