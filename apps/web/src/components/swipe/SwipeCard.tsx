import { motion, useAnimation } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { cn } from '../../lib/utils';
import { GenderBadge } from '../ui/GenderBadge';

interface Name {
	id: string;
	name: string;
	originCountry: string;
	gender: 'male' | 'female';
}

interface SwipeCardProps {
	name: Name;
	onSwipeComplete: (nameId: string, isLiked: boolean) => void;
	onDragProgress?: (progress: number) => void;
	isBackground?: boolean;
	revealProgress?: number;
}

const EXIT_DISTANCE = 500;
const EXIT_ROTATION = 30;

export function SwipeCard({
	name,
	onSwipeComplete,
	onDragProgress,
	isBackground = false,
	revealProgress = 0,
}: SwipeCardProps) {
	const controls = useAnimation();
	const SWIPE_THRESHOLD = 100;

	// Store the ID that was swiped - captured at the moment the swipe is triggered (not updated on re-renders)
	const swipedNameIdRef = useRef<string | null>(null);

	const {
		handlers,
		offset,
		isDragging,
		isExiting,
		exitDirection,
		onExitComplete,
		triggerSwipe: baseTriggerSwipe,
	} = useSwipeGesture({
		threshold: SWIPE_THRESHOLD,
	});

	// Wrap triggerSwipe to capture the name ID at the moment of swipe
	const triggerSwipe = useCallback(
		(direction: 'left' | 'right') => {
			// Capture the ID NOW, before any state changes or re-renders
			swipedNameIdRef.current = name.id;
			console.log(
				`[SwipeCard ${name.name}] triggerSwipe: Capturing nameId=${name.id} for direction=${direction}`,
			);
			baseTriggerSwipe(direction);
		},
		[baseTriggerSwipe, name.id, name.name],
	);

	// Log every render with current state
	console.log(
		`[SwipeCard ${name.name}] Render: isExiting=${isExiting}, exitDirection=${exitDirection}, isBackground=${isBackground}, nameId=${name.id}`,
	);

	// Calculate drag progress (0 to 1) and report to parent
	const dragProgress = Math.min(1, Math.abs(offset.x) / SWIPE_THRESHOLD);

	useEffect(() => {
		if (onDragProgress) {
			onDragProgress(isExiting ? 1 : dragProgress);
		}
	}, [dragProgress, isExiting, onDragProgress]);

	// Track if exit animation has already been triggered for this card
	const hasStartedExitRef = useRef(false);

	// Handle exit animation
	useEffect(() => {
		console.log(
			`[SwipeCard ${name.name}] Exit effect check: isExiting=${isExiting}, exitDirection=${exitDirection}, hasStarted=${hasStartedExitRef.current}`,
		);

		if (isExiting && exitDirection && !hasStartedExitRef.current) {
			hasStartedExitRef.current = true;
			// If swipedNameIdRef wasn't set (drag gesture), capture the ID now before animation starts
			if (!swipedNameIdRef.current) {
				swipedNameIdRef.current = name.id;
				console.log(
					`[SwipeCard ${name.name}] Drag gesture: Capturing nameId=${name.id} at animation start`,
				);
			}
			console.log(
				`[SwipeCard ${name.name}] Starting exit animation to ${exitDirection}, swipedNameId=${swipedNameIdRef.current}`,
			);

			const exitX = exitDirection === 'right' ? EXIT_DISTANCE : -EXIT_DISTANCE;
			const exitRotate = exitDirection === 'right' ? EXIT_ROTATION : -EXIT_ROTATION;

			// Capture the swiped name ID in a local variable for the animation callback
			const capturedNameId = swipedNameIdRef.current;

			controls
				.start({
					x: exitX,
					y: 50,
					rotate: exitRotate,
					opacity: 0,
					transition: {
						type: 'spring',
						stiffness: 200,
						damping: 25,
						opacity: { duration: 0.3, delay: 0.1 },
					},
				})
				.then(() => {
					// Get the direction from onExitComplete (resets internal state and returns direction)
					const direction = onExitComplete();
					// Use the CAPTURED name ID (from when the swipe was initiated)
					const isLiked = direction === 'right';

					console.log(
						`[SwipeCard ${name.name}] Exit animation completed, direction=${direction}, capturedNameId=${capturedNameId}, isLiked=${isLiked}`,
					);

					if (direction && capturedNameId) {
						onSwipeComplete(capturedNameId, isLiked);
					} else {
						console.error(
							`[SwipeCard ${name.name}] Missing data! direction=${direction}, capturedNameId=${capturedNameId}`,
						);
					}
				})
				.catch((err) => {
					console.error(`[SwipeCard ${name.name}] Exit animation error:`, err);
				});
		}
	}, [isExiting, exitDirection, controls, onExitComplete, onSwipeComplete, name.name, name.id]);

	const rotation = offset.x / 20;
	const rightOpacity = Math.max(0, Math.min(1, offset.x / 100));
	const leftOpacity = Math.max(0, Math.min(1, -offset.x / 100));

	const isBoy = name.gender === 'male';

	// Background card styling - opacity and scale follow the swipe progress
	if (isBackground) {
		// Interpolate from background state (0.7 opacity, 0.95 scale) to foreground state (1.0 opacity, 1.0 scale)
		const baseOpacity = 0.7;
		const baseScale = 0.95;
		const baseY = 20;

		const currentOpacity = baseOpacity + revealProgress * (1 - baseOpacity);
		const currentScale = baseScale + revealProgress * (1 - baseScale);
		const currentY = baseY - revealProgress * baseY;

		return (
			<motion.div
				className={cn(
					'w-full h-full bg-card rounded-[2.5rem] border-b-4 overflow-hidden absolute flex flex-col shadow-nurture',
					isBoy ? 'border-b-gender-boy/50' : 'border-b-gender-girl/50',
				)}
				style={{
					opacity: currentOpacity,
					scale: currentScale,
					y: currentY,
				}}
			>
				{/* Background Subtle Gradient */}
				<div
					className={cn(
						'absolute inset-0 opacity-[0.05] pointer-events-none',
						isBoy
							? 'bg-gradient-to-br from-gender-boy to-transparent'
							: 'bg-gradient-to-br from-gender-girl to-transparent',
					)}
				/>

				<div className="flex-1 flex flex-col items-center justify-center p-8 z-20">
					<GenderBadge gender={name.gender} size="lg" className="mb-6" />

					<h1 className="text-6xl font-heading text-charcoal mb-2 text-center tracking-tight">
						{name.name}
					</h1>

					<div className="mt-12 text-muted-foreground/40 text-sm font-medium tracking-widest uppercase">
						{name.originCountry}
					</div>
				</div>

				{/* Placeholder for action buttons - same height as foreground card buttons */}
				<div className="p-8 pt-0 flex justify-center gap-6 z-30">
					<div className="w-16 h-16" />
					<div className="w-16 h-16" />
				</div>
			</motion.div>
		);
	}

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
			transition={{ type: 'spring', stiffness: 300, damping: 20 }}
		>
			{/* Dislike Overlay */}
			<div
				className="absolute inset-0 bg-destructive/10 flex items-center justify-center pointer-events-none z-10"
				style={{ opacity: isExiting && exitDirection === 'left' ? 1 : leftOpacity }}
			>
				<X size={120} className="text-destructive drop-shadow-lg opacity-50" />
			</div>

			{/* Like Overlay */}
			<div
				className="absolute inset-0 bg-warm-clay/10 flex items-center justify-center pointer-events-none z-10"
				style={{ opacity: isExiting && exitDirection === 'right' ? 1 : rightOpacity }}
			>
				<Heart size={120} className="text-warm-clay fill-warm-clay/50 drop-shadow-md opacity-50" />
			</div>

			{/* Background Subtle Gradient */}
			<div
				className={cn(
					'absolute inset-0 opacity-[0.05] pointer-events-none',
					isBoy
						? 'bg-gradient-to-br from-gender-boy to-transparent'
						: 'bg-gradient-to-br from-gender-girl to-transparent',
				)}
			/>

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
			<div className="p-8 pt-0 flex justify-center gap-6 z-30">
				<button
					type="button"
					disabled={isExiting}
					onMouseDown={(e) => e.stopPropagation()}
					onTouchStart={(e) => e.stopPropagation()}
					onClick={(e) => {
						e.stopPropagation();
						triggerSwipe('left');
					}}
					className="w-16 h-16 rounded-full bg-white shadow-nurture border border-sage-green/10 flex items-center justify-center text-sage-green hover:bg-sage-green hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Dislike"
				>
					<X size={32} />
				</button>
				<button
					type="button"
					disabled={isExiting}
					onMouseDown={(e) => e.stopPropagation()}
					onTouchStart={(e) => e.stopPropagation()}
					onClick={(e) => {
						e.stopPropagation();
						triggerSwipe('right');
					}}
					className="w-16 h-16 rounded-full bg-white shadow-nurture border border-warm-clay/10 flex items-center justify-center text-warm-clay hover:bg-warm-clay hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Like"
				>
					<Heart size={32} className="fill-current" />
				</button>
			</div>
		</motion.div>
	);
}
