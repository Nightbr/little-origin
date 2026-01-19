import { useMutation, useQuery } from '@apollo/client';
import { NEXT_NAME_QUERY, REVIEW_NAME_MUTATION } from '../../graphql/operations';
import { SwipeCard } from './SwipeCard';

export function SwipeView() {
	const { data, loading, error, refetch } = useQuery(NEXT_NAME_QUERY, {
		fetchPolicy: 'network-only',
	});
	const [reviewName] = useMutation(REVIEW_NAME_MUTATION);

	const handleReview = async (isLiked: boolean) => {
		if (!data?.nextName) return;
		await reviewName({
			variables: { nameId: data.nextName.id, isLiked },
			refetchQueries: ['LikedNames', 'DislikedNames', 'AllMatches'],
		});
		await refetch();
	};

	if (loading)
		return (
			<div className="min-h-screen flex items-center justify-center text-sage-green animate-pulse">
				Loading names...
			</div>
		);
	if (error)
		return (
			<div className="min-h-screen flex items-center justify-center text-destructive">
				Error: {error.message}
			</div>
		);

	return (
		<div className="flex-1 flex flex-col items-center p-4 bg-background relative overflow-hidden">
			{/* Card Area */}
			<div className="flex-1 w-full flex items-center justify-center">
				{data?.nextName ? (
					<SwipeCard
						key={data.nextName.id} // Key ensures remount/reset on new name
						name={data.nextName}
						onLike={() => handleReview(true)}
						onDislike={() => handleReview(false)}
					/>
				) : (
					<div className="text-center p-12 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-sage-green/50 max-w-sm">
						<h3 className="text-3xl font-heading text-charcoal mb-2">All caught up!</h3>
						<p className="text-muted-foreground">No more names to review right now.</p>
					</div>
				)}
			</div>
		</div>
	);
}
