import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface LoadingCardProps {
	familyName?: string;
}

/**
 * Loading card component shown while fetching more names.
 * Mimics the visual style of SwipeCard with a subtle pulse animation.
 */
export function LoadingCard({ familyName }: LoadingCardProps) {
	return (
		<motion.div
			className={cn(
				'w-full h-full bg-card rounded-[2.5rem] border-b-4 overflow-hidden absolute flex flex-col shadow-nurture-lg',
				'border-b-sage-green/30',
			)}
			animate={{
				opacity: [0.5, 0.8, 0.5],
			}}
			transition={{
				duration: 1.5,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'easeInOut',
			}}
		>
			{/* Background Subtle Gradient */}
			<div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-gradient-to-br from-sage-green to-transparent" />

			{/* Main Content */}
			<div className="flex-1 flex flex-col items-center justify-center p-8 z-20">
				{/* Gender Badge Skeleton */}
				<div className="px-4 py-1.5 rounded-full bg-sage-green/10 mb-6 flex items-center gap-2">
					<div className="w-3.5 h-3.5 rounded-full bg-sage-green/20" />
					<div className="w-8 h-3 bg-sage-green/20 rounded" />
				</div>

				{/* Name Skeleton - text-6xl */}
				<div className="w-48 h-14 bg-sage-green/10 rounded-lg mb-1" />

				{/* Family Name Skeleton - text-4xl, only show if familyName is configured */}
				{familyName && <div className="w-32 h-10 bg-sage-green/10 rounded-lg mb-2" />}

				{/* Country Skeleton - text-sm uppercase tracking-widest */}
				<div className="mt-12 w-20 h-3 bg-sage-green/10 rounded" />
			</div>

			{/* Button Skeletons */}
			<div className="p-8 pt-0 flex justify-center gap-6 z-30">
				{/* Dislike Button Skeleton */}
				<div className="w-16 h-16 rounded-full bg-white shadow-nurture border border-sage-green/10 flex items-center justify-center">
					<div className="w-6 h-6 bg-sage-green/10 rounded" />
				</div>

				{/* Like Button Skeleton */}
				<div className="w-16 h-16 rounded-full bg-white shadow-nurture border border-sage-green/10 flex items-center justify-center">
					<div className="w-6 h-6 bg-sage-green/10 rounded-full" />
				</div>
			</div>
		</motion.div>
	);
}
