import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { type NameData, SwipeCardContent } from './SwipeCardContent';

interface BackgroundCardProps {
	name: NameData;
	familyName?: string;
	/** Progress of the foreground card's swipe (0-1), used to reveal this card */
	revealProgress?: number;
}

/**
 * Background card that appears behind the active swipe card.
 * Animates opacity and scale based on the foreground card's swipe progress.
 */
export function BackgroundCard({ name, familyName, revealProgress = 0 }: BackgroundCardProps) {
	const isBoy = name.gender === 'male';

	// Interpolate from background state to foreground state
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
			<SwipeCardContent
				name={name}
				familyName={familyName}
				showOverlays={false}
				showButtons={false}
			/>
		</motion.div>
	);
}
