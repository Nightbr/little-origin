import { motion, useAnimation } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import { type SwipeDirection, useSwipeGesture } from '../../hooks/useSwipeGesture';
import { cn } from '../../lib/utils';
import { type NameData, SwipeCardContent } from './SwipeCardContent';

// Re-export NameData for consumers
export type { NameData };

interface SwipeCardProps {
	name: NameData;
	familyName?: string;
	onSwipeComplete: (nameId: string, isLiked: boolean) => void;
	onDragProgress?: (progress: number) => void;
}

const SWIPE_THRESHOLD = 100;

/**
 * Interactive swipe card component.
 * Handles drag gestures and button clicks to trigger like/dislike actions.
 *
 * Key design decisions:
 * 1. Uses a state machine in useSwipeGesture to prevent stuck states
 * 2. Captures the name ID at the moment of swipe initiation (not at animation end)
 * 3. Uses framer-motion's useAnimation for controlled exit animations
 * 4. Reports drag progress to parent for background card reveal effect
 */
export function SwipeCard({ name, familyName, onSwipeComplete, onDragProgress }: SwipeCardProps) {
	const controls = useAnimation();

	// Capture the name ID at swipe initiation to avoid stale closure issues
	const capturedNameIdRef = useRef<string | null>(null);

	const { handlers, offset, isDragging, isExiting, exitDirection, triggerSwipe } = useSwipeGesture({
		threshold: SWIPE_THRESHOLD,
	});

	// Calculate drag progress (0 to 1) and report to parent
	const dragProgress = Math.min(1, Math.abs(offset.x) / SWIPE_THRESHOLD);

	useEffect(() => {
		onDragProgress?.(isExiting ? 1 : dragProgress);
	}, [dragProgress, isExiting, onDragProgress]);

	/**
	 * Handle button click to trigger swipe.
	 * Captures the name ID before triggering to ensure correct ID is used.
	 */
	const handleButtonSwipe = useCallback(
		(direction: SwipeDirection) => {
			// Capture the ID NOW before any state changes
			capturedNameIdRef.current = name.id;
			const success = triggerSwipe(direction);

			// If trigger failed (e.g., already exiting), reset the captured ID
			if (!success) {
				capturedNameIdRef.current = null;
			}

			// eslint-disable-next-line no-console
			console.log('[SwipeCard] handleButtonSwipe', {
				nameId: name.id,
				name: name.name,
				requestedDirection: direction,
				success,
			});
		},
		[name.id, name.name, triggerSwipe],
	);

	/**
	 * Handle exit animation when isExiting becomes true.
	 * Business logic (queue update + mutation) is triggered immediately,
	 * and the visual exit is now just a quick fade-out from the current position
	 * (no long swipe from the original center position).
	 */
	useEffect(() => {
		if (!isExiting || !exitDirection) {
			return;
		}

		// For drag gestures, capture the ID now if not already captured
		if (!capturedNameIdRef.current) {
			capturedNameIdRef.current = name.id;
		}

		const currentCapturedId = capturedNameIdRef.current;
		const startX = offset.x;
		const startY = offset.y;
		const startRotate = offset.x / 20;
		const isLiked = exitDirection === 'right';

		// eslint-disable-next-line no-console
		console.log('[SwipeCard] Detected exiting state', {
			nameId: currentCapturedId,
			name: name.name,
			exitDirection,
			isLiked,
		});

		if (currentCapturedId) {
			// Immediately notify parent about the swipe result so business logic
			// (queue update + mutation) is decoupled from the exit animation.
			onSwipeComplete(currentCapturedId, isLiked);
		}

		// Start from the current dragged position/rotation and fade out quickly
		controls.set({
			x: startX,
			y: startY,
			rotate: startRotate,
			opacity: 1,
		});

		controls
			.start({
				x: startX,
				y: startY,
				rotate: startRotate,
				opacity: 0,
				transition: {
					duration: 0.15,
				},
			})
			.catch((error) => {
				// eslint-disable-next-line no-console
				console.error('[SwipeCard] Exit animation error', error);
			});
	}, [isExiting, exitDirection, controls, onSwipeComplete, name.id, name.name, offset.x, offset.y]);

	const rotation = offset.x / 20;
	const rightOpacity = Math.max(0, Math.min(1, offset.x / 100));
	const leftOpacity = Math.max(0, Math.min(1, -offset.x / 100));

	const isBoy = name.gender === 'male';

	return (
		<motion.div
			className={cn(
				'w-full h-full bg-card rounded-[2.5rem] border-b-4 overflow-hidden absolute flex flex-col shadow-nurture-lg',
				isBoy ? 'border-b-gender-boy/50' : 'border-b-gender-girl/50',
			)}
			{...handlers}
			style={{
				x: isExiting ? undefined : offset.x,
				y: isExiting ? undefined : offset.y,
				rotate: isExiting ? undefined : rotation,
				cursor: isDragging ? 'grabbing' : isExiting ? 'default' : 'grab',
			}}
			animate={
				isExiting
					? controls
					: {
							scale: isDragging ? 1.02 : 1,
						}
			}
			initial={{ scale: 1, opacity: 1 }}
			transition={
				// Use quick transitions when interacting, spring only for scale feedback
				isDragging ? { type: 'spring', stiffness: 400, damping: 30 } : { duration: 0.1 }
			}
		>
			<SwipeCardContent
				name={name}
				familyName={familyName}
				showOverlays
				dislikeOpacity={leftOpacity}
				likeOpacity={rightOpacity}
				exitDirection={exitDirection}
				showButtons
				buttonsDisabled={isExiting}
				onDislike={() => handleButtonSwipe('left')}
				onLike={() => handleButtonSwipe('right')}
			/>
		</motion.div>
	);
}
