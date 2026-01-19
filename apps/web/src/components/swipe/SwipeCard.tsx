import { motion } from 'framer-motion';
import { BabyIcon, Heart, X } from 'lucide-react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { cn } from '../../lib/utils';

interface Name {
	id: string;
	name: string;
	originCountry: string;
	gender: 'male' | 'female';
}

interface SwipeCardProps {
	name: Name;
	onLike: () => void;
	onDislike: () => void;
}

export function SwipeCard({ name, onLike, onDislike }: SwipeCardProps) {
	const { handlers, offset, isDragging } = useSwipeGesture({
		onSwipeLeft: onDislike,
		onSwipeRight: onLike,
		threshold: 100,
	});

	const rotation = offset.x / 20;
	const rightOpacity = Math.max(0, Math.min(1, offset.x / 100));
	const leftOpacity = Math.max(0, Math.min(1, -offset.x / 100));

	const isBoy = name.gender === 'male';

	return (
		<div className="relative w-full max-w-sm aspect-[3/4] perspective-1000">
			<motion.div
				className={cn(
					'w-full h-full bg-card rounded-[2.5rem] shadow-nurture-lg border-b-4 overflow-hidden absolute flex flex-col',
					isBoy ? 'border-b-sage-green/30' : 'border-b-warm-clay/30',
				)}
				{...handlers}
				style={{
					x: offset.x,
					y: offset.y,
					rotate: rotation,
					cursor: isDragging ? 'grabbing' : 'grab',
				}}
				animate={{
					scale: isDragging ? 1.02 : 1,
				}}
				transition={{ type: 'spring', stiffness: 300, damping: 20 }}
			>
				{/* Dislike Overlay */}
				<div
					className="absolute inset-0 bg-destructive/10 flex items-center justify-center pointer-events-none z-10"
					style={{ opacity: leftOpacity }}
				>
					<X size={120} className="text-destructive drop-shadow-lg opacity-50" />
				</div>

				{/* Like Overlay */}
				<div
					className="absolute inset-0 bg-warm-clay/10 flex items-center justify-center pointer-events-none z-10"
					style={{ opacity: rightOpacity }}
				>
					<Heart
						size={120}
						className="text-warm-clay fill-warm-clay/50 drop-shadow-md opacity-50"
					/>
				</div>

				{/* Background Subtle Gradient */}
				<div
					className={cn(
						'absolute inset-0 opacity-[0.03] pointer-events-none',
						isBoy
							? 'bg-gradient-to-br from-sage-green to-transparent'
							: 'bg-gradient-to-br from-warm-clay to-transparent',
					)}
				/>

				<div className="flex-1 flex flex-col items-center justify-center p-8 z-20">
					{/* Gender Badge */}
					<div
						className={cn(
							'mb-6 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2',
							isBoy ? 'bg-sage-green/10 text-sage-green' : 'bg-warm-clay/10 text-warm-clay',
						)}
					>
						<BabyIcon size={14} />
						{isBoy ? 'Boy' : 'Girl'}
					</div>

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
						onClick={(e) => {
							e.stopPropagation();
							onDislike();
						}}
						className="w-16 h-16 rounded-full bg-white shadow-nurture border border-sage-green/10 flex items-center justify-center text-sage-green hover:bg-sage-green hover:text-white transition-all active:scale-95"
						aria-label="Dislike"
					>
						<X size={32} />
					</button>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onLike();
						}}
						className="w-16 h-16 rounded-full bg-white shadow-nurture border border-warm-clay/10 flex items-center justify-center text-warm-clay hover:bg-warm-clay hover:text-white transition-all active:scale-95"
						aria-label="Like"
					>
						<Heart size={32} className="fill-current" />
					</button>
				</div>
			</motion.div>
		</div>
	);
}
