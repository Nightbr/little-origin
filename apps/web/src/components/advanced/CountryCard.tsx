import { COUNTRY_FLAGS } from '@/lib/constants';
import type { CountryStatus, IngestionProgressData } from '@/lib/ingestion';
import { getStatus } from '@/lib/ingestion';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusBadge } from './StatusBadge';

interface CountryCardProps {
	country: CountryStatus;
	onStart: () => void;
	isAnyIngesting: boolean;
}

export function CountryCard({ country, onStart, isAnyIngesting }: CountryCardProps) {
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
			{country.isIngesting && localProgress && (
				<AnimatePresence>
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="mb-4"
					>
						<div className="text-sm text-muted-foreground">
							<span className="font-semibold text-primary">
								{localProgress.processedNames.toLocaleString()}
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
