import { Heart, X } from 'lucide-react';
import type { SwipeDirection } from '../../hooks/useSwipeGesture';
import { cn } from '../../lib/utils';
import { GenderBadge } from '../ui/GenderBadge';

export interface NameData {
	id: string;
	name: string;
	originCountry: string;
	gender: 'male' | 'female';
}

interface SwipeCardContentProps {
	name: NameData;
	/** Whether to show like/dislike overlays based on drag direction */
	showOverlays?: boolean;
	/** Opacity for the dislike overlay (0-1) */
	dislikeOpacity?: number;
	/** Opacity for the like overlay (0-1) */
	likeOpacity?: number;
	/** Whether to show action buttons */
	showButtons?: boolean;
	/** Whether buttons are disabled */
	buttonsDisabled?: boolean;
	/** Callback when dislike button is clicked */
	onDislike?: () => void;
	/** Callback when like button is clicked */
	onLike?: () => void;
	/** Fixed exit direction (shows overlay at full opacity when exiting) */
	exitDirection?: SwipeDirection | null;
}

/**
 * Pure presentational component for card content.
 * Handles the visual display of a name card without any gesture logic.
 */
export function SwipeCardContent({
	name,
	showOverlays = true,
	dislikeOpacity = 0,
	likeOpacity = 0,
	showButtons = true,
	buttonsDisabled = false,
	onDislike,
	onLike,
	exitDirection,
}: SwipeCardContentProps) {
	const isBoy = name.gender === 'male';

	// When exiting, show the appropriate overlay at full opacity
	const finalDislikeOpacity = exitDirection === 'left' ? 1 : dislikeOpacity;
	const finalLikeOpacity = exitDirection === 'right' ? 1 : likeOpacity;

	return (
		<>
			{/* Dislike Overlay */}
			{showOverlays && (
				<div
					className="absolute inset-0 bg-destructive/10 flex items-center justify-center pointer-events-none z-10"
					style={{ opacity: finalDislikeOpacity }}
				>
					<X size={120} className="text-destructive drop-shadow-lg opacity-50" />
				</div>
			)}

			{/* Like Overlay */}
			{showOverlays && (
				<div
					className="absolute inset-0 bg-warm-clay/10 flex items-center justify-center pointer-events-none z-10"
					style={{ opacity: finalLikeOpacity }}
				>
					<Heart
						size={120}
						className="text-warm-clay fill-warm-clay/50 drop-shadow-md opacity-50"
					/>
				</div>
			)}

			{/* Background Subtle Gradient */}
			<div
				className={cn(
					'absolute inset-0 opacity-[0.05] pointer-events-none',
					isBoy
						? 'bg-gradient-to-br from-gender-boy to-transparent'
						: 'bg-gradient-to-br from-gender-girl to-transparent',
				)}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col items-center justify-center p-8 z-20">
				<GenderBadge gender={name.gender} size="lg" className="mb-6" />

				<h1 className="text-6xl font-heading text-charcoal mb-2 text-center tracking-tight">
					{name.name}
				</h1>

				<div className="mt-12 text-muted-foreground/40 text-sm font-medium tracking-widest uppercase">
					{name.originCountry}
				</div>
			</div>

			{/* Action Buttons */}
			{showButtons ? (
				<div className="p-8 pt-0 flex justify-center gap-6 z-30">
					<button
						type="button"
						disabled={buttonsDisabled}
						onMouseDown={(e) => e.stopPropagation()}
						onTouchStart={(e) => e.stopPropagation()}
						onClick={(e) => {
							e.stopPropagation();
							onDislike?.();
						}}
						className="w-16 h-16 rounded-full bg-white shadow-nurture border border-sage-green/10 flex items-center justify-center text-sage-green hover:bg-sage-green hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Dislike"
					>
						<X size={32} />
					</button>
					<button
						type="button"
						disabled={buttonsDisabled}
						onMouseDown={(e) => e.stopPropagation()}
						onTouchStart={(e) => e.stopPropagation()}
						onClick={(e) => {
							e.stopPropagation();
							onLike?.();
						}}
						className="w-16 h-16 rounded-full bg-white shadow-nurture border border-warm-clay/10 flex items-center justify-center text-warm-clay hover:bg-warm-clay hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Like"
					>
						<Heart size={32} className="fill-current" />
					</button>
				</div>
			) : (
				// Placeholder for buttons to maintain card height consistency
				<div className="p-8 pt-0 flex justify-center gap-6 z-30">
					<div className="w-16 h-16" />
					<div className="w-16 h-16" />
				</div>
			)}
		</>
	);
}
