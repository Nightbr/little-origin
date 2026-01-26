import { cn } from '../../lib/utils';

export type Gender = 'male' | 'female';

type BadgeSize = 'sm' | 'md' | 'lg';

interface GenderBadgeProps {
	gender: Gender;
	size?: BadgeSize;
	muted?: boolean;
	className?: string;
}

const sizeClasses: Record<BadgeSize, string> = {
	sm: 'px-2.5 py-0.5 text-[10px]',
	md: 'px-3 py-1 text-xs',
	lg: 'px-4 py-1.5 text-xs',
};

export function GenderBadge({ gender, size = 'md', muted = false, className }: GenderBadgeProps) {
	const isBoy = gender === 'male';

	return (
		<span
			className={cn(
				'rounded-full font-bold tracking-wider uppercase text-gender-boy-foreground',
				sizeClasses[size],
				isBoy
					? muted
						? 'bg-gender-boy/80'
						: 'bg-gender-boy'
					: muted
						? 'bg-gender-girl/80'
						: 'bg-gender-girl',
				className,
			)}
		>
			{isBoy ? 'Boy' : 'Girl'}
		</span>
	);
}
