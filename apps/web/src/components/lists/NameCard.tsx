import { type Gender, GenderBadge } from '@/components/ui/GenderBadge';
import { REVIEW_NAME_MUTATION } from '@/graphql/operations';
import { type Reference, useMutation } from '@apollo/client';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ChangeDecisionDialog } from './ChangeDecisionDialog';

interface NameCardProps {
	id: string;
	name: string;
	gender: Gender;
	originCountry: string;
	isLiked: boolean;
	familyName?: string;
}

export function NameCard({ id, name, gender, originCountry, isLiked, familyName }: NameCardProps) {
	const [showButton, setShowButton] = useState(false);
	const [showDialog, setShowDialog] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);

	const [reviewName, { loading: isChanging }] = useMutation(REVIEW_NAME_MUTATION, {
		update: (cache, { data }) => {
			if (!data) return;

			const nameId = id;

			// Remove from both lists (the item will be re-fetched on navigation)
			cache.modify({
				fields: {
					likedNames: (existingRefs, { readField }) =>
						(existingRefs ?? []).filter((ref: Reference) => readField('id', ref) !== nameId),
					dislikedNames: (existingRefs, { readField }) =>
						(existingRefs ?? []).filter((ref: Reference) => readField('id', ref) !== nameId),
				},
			});
		},
		refetchQueries: isLiked ? ['DislikedNames'] : ['LikedNames'],
	});

	// Handle click outside to hide button
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
				setShowButton(false);
			}
		};

		if (showButton) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showButton]);

	const handleCardClick = () => {
		setShowButton(true);
	};

	const handleCardKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			setShowButton(true);
		}
	};

	const handleButtonClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowDialog(true);
	};

	const handleDialogClose = () => {
		setShowDialog(false);
	};

	const handleConfirm = async () => {
		await reviewName({
			variables: {
				nameId: id,
				isLiked: !isLiked,
			},
		});
		setShowDialog(false);
		setShowButton(false);
	};

	const actionText = isLiked ? 'Dislike' : 'Like';
	const ActionIcon = isLiked ? ThumbsDown : ThumbsUp;

	// Different styles for liked vs disliked
	const cardClasses = isLiked
		? 'p-6 min-h-[120px] bg-white rounded-2xl border border-border shadow-nurture transition-all hover:scale-[1.02] cursor-pointer text-left relative'
		: 'p-6 min-h-[120px] bg-white/50 rounded-2xl border border-border transition-all opacity-60 hover:opacity-100 cursor-pointer text-left relative';

	const textColorClass = isLiked ? 'text-charcoal' : 'text-charcoal/80';
	const textColorSub = isLiked ? 'text-charcoal/70' : 'text-charcoal/50';

	return (
		<>
			<div
				className={cardClasses}
				onClick={handleCardClick}
				onKeyDown={handleCardKeyDown}
				// biome-ignore lint/a11y/useSemanticElements: Using div to avoid nesting buttons (the action button inside)
				role="button"
				tabIndex={0}
				ref={cardRef}
			>
				{showButton ? (
					<div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl animate-in fade-in zoom-in-95 duration-200">
						<button
							type="button"
							onClick={handleButtonClick}
							disabled={isChanging}
							className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<ActionIcon size={18} />
							<span className="font-semibold">{actionText}</span>
						</button>
					</div>
				) : (
					<>
						<div className="flex items-start justify-between gap-2 mb-2">
							<h3 className={`text-2xl font-heading ${textColorClass} flex-1`}>
								{name}
								{familyName && <span className={`${textColorSub} ml-1`}> {familyName}</span>}
							</h3>
							<div className="flex-shrink-0">
								<GenderBadge gender={gender} size="md" muted={!isLiked} />
							</div>
						</div>
						<p className="text-muted-foreground text-sm">{originCountry}</p>
					</>
				)}
			</div>

			<ChangeDecisionDialog
				isOpen={showDialog}
				onClose={handleDialogClose}
				onConfirm={handleConfirm}
				name={name}
				isLiked={isLiked}
				familyName={familyName}
				loading={isChanging}
			/>
		</>
	);
}
