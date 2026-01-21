import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	GET_PREFERENCES_QUERY,
	NEXT_NAMES_QUERY,
	REVIEW_NAME_MUTATION,
} from '../../graphql/operations';
import { BackgroundCard } from './BackgroundCard';
import { type NameData, SwipeCard } from './SwipeCard';

const PREFETCH_THRESHOLD = 2;
const FETCH_BATCH_SIZE = 5;

export function SwipeView() {
	const [fetchNames, { loading, error }] = useLazyQuery<{ nextNames: NameData[] }>(
		NEXT_NAMES_QUERY,
		{
			fetchPolicy: 'network-only',
		},
	);
	const [reviewName] = useMutation(REVIEW_NAME_MUTATION);
	const { data: prefsData } = useQuery(GET_PREFERENCES_QUERY);
	const familyName = prefsData?.preferences?.familyName || '';

	// Local queue of names - the source of truth for the UI
	const [nameQueue, setNameQueue] = useState<NameData[]>([]);
	const [isInitialized, setIsInitialized] = useState(false);
	const isFetchingRef = useRef(false);
	const nameQueueRef = useRef<NameData[]>([]);

	// Keep ref in sync with state
	useEffect(() => {
		nameQueueRef.current = nameQueue;
		console.log(
			'[SwipeView] Queue updated:',
			nameQueue.map((n) => `${n.id}:${n.name}`),
		);
	}, [nameQueue]);

	// Fetch more names and append to queue
	const fetchMoreNames = useCallback(async () => {
		if (isFetchingRef.current) {
			console.log('[SwipeView] fetchMoreNames: Already fetching, skipping');
			return;
		}
		isFetchingRef.current = true;

		try {
			// Get current queue IDs to exclude from the API response
			const currentQueueIds = nameQueueRef.current.map((n) => n.id);
			console.log('[SwipeView] fetchMoreNames: Fetching with excludeIds:', currentQueueIds);

			const result = await fetchNames({
				variables: {
					limit: FETCH_BATCH_SIZE,
					excludeIds: currentQueueIds,
				},
			});
			const newNames = result.data?.nextNames ?? [];
			console.log(
				'[SwipeView] fetchMoreNames: API returned:',
				newNames.map((n) => `${n.id}:${n.name}`),
			);

			if (newNames.length > 0) {
				setNameQueue((prev) => {
					const updated = [...prev, ...newNames];
					console.log(
						'[SwipeView] fetchMoreNames: Appending to queue. Prev:',
						prev.length,
						'New:',
						newNames.length,
						'Total:',
						updated.length,
					);
					return updated;
				});
			}
		} finally {
			isFetchingRef.current = false;
		}
	}, [fetchNames]);

	// Initial fetch
	useEffect(() => {
		if (!isInitialized) {
			console.log('[SwipeView] Initial fetch starting');
			fetchMoreNames().then(() => {
				console.log('[SwipeView] Initial fetch complete, setting initialized');
				setIsInitialized(true);
			});
		}
	}, [isInitialized, fetchMoreNames]);

	// Prefetch when queue is running low
	useEffect(() => {
		console.log(
			'[SwipeView] Prefetch check: initialized=',
			isInitialized,
			'queueLength=',
			nameQueue.length,
			'threshold=',
			PREFETCH_THRESHOLD,
			'isFetching=',
			isFetchingRef.current,
		);
		if (isInitialized && nameQueue.length <= PREFETCH_THRESHOLD && !isFetchingRef.current) {
			console.log('[SwipeView] Triggering prefetch');
			fetchMoreNames();
		}
	}, [isInitialized, nameQueue.length, fetchMoreNames]);

	const currentName = nameQueue[0];
	const nextName = nameQueue[1];

	console.log(
		'[SwipeView] Render: currentName=',
		currentName?.name,
		'nextName=',
		nextName?.name,
		'queueLength=',
		nameQueue.length,
	);

	// Track drag progress for smooth background card reveal
	const [dragProgress, setDragProgress] = useState(0);

	const handleDragProgress = useCallback((progress: number) => {
		setDragProgress(progress);
	}, []);

	const handleSwipeComplete = useCallback(
		async (nameId: string, isLiked: boolean) => {
			const swipedName = nameQueueRef.current.find((n) => n.id === nameId);
			console.log(
				'[SwipeView] handleSwipeComplete: Swiping',
				swipedName?.name ?? nameId,
				isLiked ? 'LIKE' : 'DISLIKE',
			);

			// Reset drag progress
			setDragProgress(0);

			// Remove the swiped name from queue by ID (not just first element)
			setNameQueue((prev) => {
				const updated = prev.filter((n) => n.id !== nameId);
				console.log(
					'[SwipeView] handleSwipeComplete: Removed from queue. New queue:',
					updated.map((n) => `${n.id}:${n.name}`),
				);
				return updated;
			});

			// Submit review in background
			reviewName({
				variables: { nameId, isLiked },
			});
		},
		[reviewName],
	);

	if (!isInitialized && loading) {
		return (
			<div className="min-h-screen flex items-center justify-center text-sage-green animate-pulse">
				Loading names...
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center text-destructive">
				Error: {error.message}
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col items-center p-4 bg-background relative overflow-hidden">
			{/* Card Area */}
			<div className="flex-1 w-full flex items-center justify-center">
				{currentName ? (
					<div className="relative w-full max-w-sm aspect-[3/4] perspective-1000">
						{/* Next card (background) - opacity/scale follow drag progress */}
						{nextName && (
							<div className="absolute inset-0 z-0">
								<BackgroundCard
									name={nextName}
									familyName={familyName}
									revealProgress={dragProgress}
								/>
							</div>
						)}

						{/* Current card (foreground) - always on top, no enter animation since background card already animated */}
						<div className="absolute inset-0 z-10">
							<SwipeCard
								key={currentName.id}
								name={currentName}
								familyName={familyName}
								onSwipeComplete={handleSwipeComplete}
								onDragProgress={handleDragProgress}
							/>
						</div>
					</div>
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
