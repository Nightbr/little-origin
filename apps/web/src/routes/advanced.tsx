import {
	INGESTION_STATUS_QUERY,
	NAME_INGESTION_PROGRESS_SUBSCRIPTION,
	START_INGESTION_MUTATION,
} from '@/graphql/operations';
import { PRUNE_EXTENDED_NAMES_MUTATION } from '@/graphql/operations';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const COUNTRY_FLAGS: Record<string, string> = {
	US: '🇺🇸',
	GB: '🇬🇧',
	FR: '🇫🇷',
	IT: '🇮🇹',
	DE: '🇩🇪',
	ES: '🇪🇸',
	IE: '🇮🇪',
};

interface IngestionProgressData {
	country: string;
	totalNames: number;
	processedNames: number;
	currentBatch: number;
	totalBatches: number;
}

interface CountryStatus {
	country: string;
	countryName: string;
	loadedCount: number;
	isIngesting: boolean;
	progress: IngestionProgressData | null;
	error: string | null;
}

export const Route = createFileRoute('/advanced')({
	beforeLoad: ({ context }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: () => (
		<div className="p-8 max-w-4xl mx-auto w-full">
			<header className="mb-12">
				<h1 className="text-4xl font-heading text-primary mb-2">Advanced Settings</h1>
				<p className="text-muted-foreground">
					Load extended baby name datasets from external sources.
				</p>
			</header>
			<div className="space-y-12">
				<AdvancedIngestion />
				<hr className="border-sage-green/20" />
				<PruneDatabase />
			</div>
		</div>
	),
});

function AdvancedIngestion() {
	const { data, loading, error, refetch } = useQuery(INGESTION_STATUS_QUERY, {
		fetchPolicy: 'network-only',
	});

	// Subscription for real-time progress updates
	useSubscription(NAME_INGESTION_PROGRESS_SUBSCRIPTION, {
		onData: () => {
			refetch();
		},
	});

	const [startIngestion] = useMutation(START_INGESTION_MUTATION, {
		onCompleted: () => {
			refetch();
		},
	});

	if (loading) {
		return (
			<div className="text-center py-20 animate-pulse text-sage-green">
				Loading ingestion status...
			</div>
		);
	}

	if (error) {
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;
	}

	const countries = data?.ingestionStatus || [];
	const isAnyIngesting = countries.some((c: CountryStatus) => c.isIngesting);

	return (
		<div className="space-y-4">
			{countries.map((country: CountryStatus) => (
				<CountryCard
					key={country.country}
					country={country}
					onStart={() => startIngestion({ variables: { country: country.country } })}
					isAnyIngesting={isAnyIngesting}
				/>
			))}
		</div>
	);
}

interface CountryCardProps {
	country: CountryStatus;
	onStart: () => void;
	isAnyIngesting: boolean;
}

function CountryCard({ country, onStart, isAnyIngesting }: CountryCardProps) {
	const [localProgress, setLocalProgress] = useState<IngestionProgressData | null>(
		country.progress,
	);
	const [localError, setLocalError] = useState<string | null>(country.error);

	// Update local state when props change
	useEffect(() => {
		setLocalProgress(country.progress);
	}, [country.progress]);

	useEffect(() => {
		setLocalError(country.error);
	}, [country.error]);

	const flag = COUNTRY_FLAGS[country.country] || '🌍';
	const status = getStatus(country.isIngesting, localError);
	const progress = localProgress;

	const handleStart = () => {
		setLocalError(null);
		onStart();
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white rounded-2xl p-6 border border-sage-green/10 shadow-sm"
		>
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					<span className="text-4xl">{flag}</span>
					<div>
						<h3 className="text-xl font-heading font-semibold text-charcoal">
							{country.countryName}
						</h3>
						<p className="text-sm text-muted-foreground">
							{country.loadedCount.toLocaleString()} names loaded
						</p>
					</div>
				</div>
				{status !== 'ready' && <StatusBadge status={status} />}
			</div>

			{/* Progress Display */}
			{country.isIngesting && progress && (
				<AnimatePresence>
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="mb-4"
					>
						<div className="text-sm text-muted-foreground">
							<span className="font-semibold text-primary">
								{progress.processedNames.toLocaleString()}
							</span>{' '}
							names processed
						</div>
					</motion.div>
				</AnimatePresence>
			)}

			{/* Error Message */}
			{localError && (
				<div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
					<AlertCircle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
					<p className="text-sm text-destructive">{localError}</p>
				</div>
			)}

			{/* Action Button */}
			{status !== 'completed' && !isAnyIngesting && (
				<button
					type="button"
					onClick={handleStart}
					className={cn(
						'w-full py-3 px-4 rounded-xl font-heading font-semibold transition-all flex items-center justify-center gap-2',
						localError
							? 'bg-destructive text-white hover:bg-destructive/90'
							: 'bg-primary text-white hover:bg-primary/90 active:scale-95',
					)}
				>
					{localError ? (
						<>
							<RefreshCw size={18} />
							Retry
						</>
					) : (
						'Load More Names'
					)}
				</button>
			)}
		</motion.div>
	);
}

function getStatus(
	isIngesting: boolean,
	error: string | null,
): 'ready' | 'processing' | 'completed' | 'failed' {
	if (error) return 'failed';
	if (isIngesting) return 'processing';
	return 'ready';
}

interface StatusBadgeProps {
	status: 'ready' | 'processing' | 'completed' | 'failed';
}

function StatusBadge({ status }: StatusBadgeProps) {
	const variants = {
		ready: {
			bg: 'bg-calm-ivory',
			text: 'text-charcoal',
			label: 'Ready',
			icon: null,
		},
		processing: {
			bg: 'bg-primary/10',
			text: 'text-primary',
			label: 'Processing',
			icon: Loader2,
		},
		completed: {
			bg: 'bg-sage-green/10',
			text: 'text-sage-green',
			label: 'Completed',
			icon: CheckCircle,
		},
		failed: {
			bg: 'bg-destructive/10',
			text: 'text-destructive',
			label: 'Failed',
			icon: AlertCircle,
		},
	};

	const { bg, text, label, icon: Icon } = variants[status];

	return (
		<div
			className={cn(
				'px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5',
				bg,
				text,
			)}
		>
			{Icon && <Icon size={14} className={status === 'processing' ? 'animate-spin' : ''} />}
			{label}
		</div>
	);
}

function PruneDatabase() {
	const [pruneExtendedNames, { loading }] = useMutation(PRUNE_EXTENDED_NAMES_MUTATION);
	const [confirming, setConfirming] = useState(false);
	const [deletedCount, setDeletedCount] = useState<number | null>(null);

	const handlePrune = async () => {
		if (!confirming) {
			setConfirming(true);
			return;
		}

		try {
			const result = await pruneExtendedNames();
			setDeletedCount(result.data?.pruneExtendedNames ?? 0);
			setConfirming(false);

			// Reset success message after 5 seconds
			setTimeout(() => setDeletedCount(null), 5000);
		} catch (error) {
			console.error('Prune failed:', error);
		}
	};

	return (
		<section className="space-y-4">
			<div className="flex items-start justify-between">
				<div>
					<h2 className="text-2xl font-heading text-charcoal mb-2">Prune Database</h2>
					<p className="text-muted-foreground max-w-xl">
						Remove imported names that haven't been liked or matched by any user. This cleans up the
						database by deleting unused "extended" source names, while protecting liked names,
						matches, and static data.
					</p>
				</div>
			</div>

			<div className="bg-white rounded-2xl p-6 border border-sage-green/10 shadow-sm flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
						<Trash2 size={24} />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-charcoal">Clean Unused Names</h3>
						<p className="text-sm text-muted-foreground">This action cannot be undone.</p>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{deletedCount !== null && (
						<span className="text-sm font-medium text-sage-green animate-in fade-in slide-in-from-right-4">
							Successfully removed {deletedCount.toLocaleString()} names
						</span>
					)}

					{confirming ? (
						<div className="flex gap-2 animate-in fade-in zoom-in-95">
							<button
								type="button"
								onClick={() => setConfirming(false)}
								className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/5"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handlePrune}
								disabled={loading}
								className="px-4 py-2 rounded-xl bg-destructive text-white font-medium hover:bg-destructive/90 flex items-center gap-2"
							>
								{loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
								Confirm Delete
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setConfirming(true)}
							className="px-6 py-3 rounded-xl border border-destructive/20 text-destructive font-semibold hover:bg-destructive/5 active:scale-95 transition-all"
						>
							Prune Database
						</button>
					)}
				</div>
			</div>
		</section>
	);
}

// Utility function for className (copy from lib/utils.ts)
function cn(...classes: (string | boolean | undefined | null)[]) {
	return classes.filter(Boolean).join(' ');
}
