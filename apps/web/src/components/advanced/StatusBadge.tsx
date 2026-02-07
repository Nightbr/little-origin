import type { StatusType } from '@/lib/ingestion';
import { STATUS_BADGE_VARIANTS } from '@/lib/ingestion';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
	status: StatusType;
}

// Icon mapping for each status type
const STATUS_ICONS: Record<
	StatusType,
	React.ComponentType<{ size?: number | string; className?: string }> | null
> = {
	ready: null,
	processing: Loader2,
	completed: CheckCircle,
	failed: AlertCircle,
};

export function StatusBadge({ status }: StatusBadgeProps) {
	const variant = STATUS_BADGE_VARIANTS[status];
	const Icon = STATUS_ICONS[status];

	return (
		<div
			className={cn(
				'px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5',
				variant.bg,
				variant.text,
			)}
		>
			{Icon && <Icon size={14} className={status === 'processing' ? 'animate-spin' : ''} />}
			{variant.label}
		</div>
	);
}
