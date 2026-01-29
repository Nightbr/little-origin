import { ListCounter, ListFilters } from '@/components/lists/ListFilters';
import { type Gender, GenderBadge } from '@/components/ui/GenderBadge';
import {
	ALL_MATCHES_QUERY,
	GET_PREFERENCES_QUERY,
	MATCH_CREATED_SUBSCRIPTION,
} from '@/graphql/operations';
import { useListFilter } from '@/hooks/useListFilter';
import { useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Users } from 'lucide-react';
import { useCallback, useEffect } from 'react';

interface MatchUser {
	id: string;
	username: string;
}

interface MatchName {
	name: string;
	gender: Gender;
}

interface MatchItem {
	id: string;
	name: MatchName;
	likedBy: MatchUser[];
}

export const Route = createFileRoute('/matches')({
	beforeLoad: ({ context }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: () => (
		<div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
			<MatchesList />
		</div>
	),
});

function MatchesList() {
	const { data, loading, error, subscribeToMore } = useQuery(ALL_MATCHES_QUERY, {
		fetchPolicy: 'network-only',
	});
	const { data: prefsData } = useQuery(GET_PREFERENCES_QUERY);
	const familyName = prefsData?.preferences?.familyName || '';

	useEffect(() => {
		const unsubscribe = subscribeToMore({
			document: MATCH_CREATED_SUBSCRIPTION,
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData.data) return prev;
				const newMatch = subscriptionData.data.matchCreated;

				// Check if already in list to avoid duplicates
				if (prev.allMatches.find((m: MatchItem) => m.id === newMatch.id)) {
					return prev;
				}

				return {
					...prev,
					allMatches: [newMatch, ...prev.allMatches],
				};
			},
		});
		return () => unsubscribe();
	}, [subscribeToMore]);

	const matches: MatchItem[] = data?.allMatches || [];

	// For matches, we need to access the nested name object
	const getName = useCallback((item: MatchItem) => item.name.name, []);
	const getGender = useCallback((item: MatchItem) => item.name.gender, []);
	// Matches don't have country info in the current schema, so we'll skip country filtering
	const getCountry = useCallback(() => '', []);

	const {
		filters,
		setFilters,
		filteredItems,
		totalCount,
		filteredCount,
		hasActiveFilters,
		activeFilterCount,
		clearFilters,
	} = useListFilter({
		items: matches,
		getName,
		getGender,
		getCountry,
		storageKey: 'lo_matches_filters',
	});

	if (loading)
		return (
			<div className="text-center py-20 animate-pulse text-sage-green">Finding matches...</div>
		);
	if (error)
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;

	return (
		<>
			<header className="mb-6">
				<h1 className="text-3xl sm:text-4xl font-heading text-primary mb-1">Your Matches</h1>
				<ListCounter
					totalCount={totalCount}
					filteredCount={filteredCount}
					hasActiveFilters={hasActiveFilters}
					itemName="matches"
				/>
			</header>

			<ListFilters
				filters={filters}
				setFilters={setFilters}
				hasActiveFilters={hasActiveFilters}
				activeFilterCount={activeFilterCount}
				clearFilters={clearFilters}
			/>

			{filteredItems.length === 0 ? (
				<div className="text-center py-20 p-8 bg-white/50 border border-dashed border-sage-green/30 rounded-3xl">
					<Users size={48} className="mx-auto mb-4 text-sage-green/30" />
					<h3 className="text-2xl font-heading text-charcoal mb-2">
						{hasActiveFilters ? 'No matches found' : 'No matches yet'}
					</h3>
					<p className="text-muted-foreground">
						{hasActiveFilters
							? 'Try adjusting your filters.'
							: 'Invite others to your circle to see shared likes!'}
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{filteredItems.map((match: MatchItem) => (
						<div
							key={match.id}
							className="p-4 sm:p-6 bg-white rounded-3xl border border-border shadow-nurture-lg relative overflow-hidden group"
						>
							<div className="flex flex-col gap-3 sm:gap-4">
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2 min-w-0">
										<h3 className="text-2xl sm:text-3xl font-heading text-primary truncate">
											{match.name.name}
										</h3>
										{familyName && (
											<span className="text-xl sm:text-2xl text-primary/70 hidden sm:inline">
												{familyName}
											</span>
										)}
									</div>
									<GenderBadge gender={match.name.gender} size="md" />
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<span className="text-xs sm:text-sm font-bold text-charcoal/40 mr-1 sm:mr-2">
										LIKED BY:
									</span>
									{match.likedBy.map((user: MatchUser) => (
										<span
											key={user.username}
											className="px-2 sm:px-3 py-1 bg-calm-ivory text-charcoal rounded-full text-xs sm:text-sm font-semibold border border-sage-green/10"
										>
											{user.username}
										</span>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
}
