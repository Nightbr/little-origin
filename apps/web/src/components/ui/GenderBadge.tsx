import { BabyIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type Gender = 'male' | 'female';

type BadgeSize = 'sm' | 'md' | 'lg';

interface GenderBadgeProps {
	gender: Gender;
	size?: BadgeSize;
	muted?: boolean;
	className?: string;
}

const sizeClasses: Record<BadgeSize, { container: string; icon: number }> = {
	sm: { container: 'px-2.5 py-0.5 text-[10px] gap-1', icon: 10 },
	md: { container: 'px-3 py-1 text-xs gap-1.5', icon: 12 },
	lg: { container: 'px-4 py-1.5 text-xs gap-2', icon: 14 },
};

export function GenderBadge({ gender, size = 'md', muted = false, className }: GenderBadgeProps) {
	const isBoy = gender === 'male';
	const sizeConfig = sizeClasses[size];

	return (
		<span
			className={cn(
				'rounded-full font-bold tracking-wider uppercase flex items-center text-gender-boy-foreground',
				sizeConfig.container,
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
			<BabyIcon size={sizeConfig.icon} />
			{isBoy ? 'Boy' : 'Girl'}
		</span>
	);
}
