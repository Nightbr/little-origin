import { ListCounter, ListFilters } from '@/components/lists/ListFilters';
import { NameCard } from '@/components/lists/NameCard';
import { GET_PREFERENCES_QUERY, LIKED_NAMES_QUERY } from '@/graphql/operations';
import { useListFilter } from '@/hooks/useListFilter';
import { useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Heart } from 'lucide-react';
import { useCallback } from 'react';

interface NameItem {
	id: string;
	name: string;
	gender: string;
	originCountry: string;
}

export const Route = createFileRoute('/likes')({
	beforeLoad: ({ context }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: () => (
		<div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
			<LikesList />
		</div>
	),
});

function LikesList() {
	const { data, loading, error } = useQuery(LIKED_NAMES_QUERY, { fetchPolicy: 'network-only' });
	const { data: prefsData } = useQuery(GET_PREFERENCES_QUERY);
	const familyName = prefsData?.preferences?.familyName || '';

	const names: NameItem[] = data?.likedNames || [];

	const getName = useCallback((item: NameItem) => item.name, []);
	const getGender = useCallback((item: NameItem) => item.gender, []);
	const getCountry = useCallback((item: NameItem) => item.originCountry, []);

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
		items: names,
		getName,
		getGender,
		getCountry,
		storageKey: 'lo_liked_filters',
	});

	if (loading)
		return (
			<div className="text-center py-20 animate-pulse text-sage-green">
				Loading your favorites...
			</div>
		);
	if (error)
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;

	return (
		<>
			<header className="mb-6">
				<h1 className="text-3xl sm:text-4xl font-heading text-primary mb-1">Liked Names</h1>
				<ListCounter
					totalCount={totalCount}
					filteredCount={filteredCount}
					hasActiveFilters={hasActiveFilters}
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
					<Heart size={48} className="mx-auto mb-4 text-sage-green/30" />
					<h3 className="text-2xl font-heading text-charcoal mb-2">
						{hasActiveFilters ? 'No matches found' : 'No likes yet'}
					</h3>
					<p className="text-muted-foreground">
						{hasActiveFilters
							? 'Try adjusting your filters.'
							: 'Keep swiping to find the perfect name!'}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
					{filteredItems.map((name: NameItem) => (
						<NameCard
							key={name.id}
							id={name.id}
							name={name.name}
							gender={name.gender as 'male' | 'female'}
							originCountry={name.originCountry}
							isLiked={true}
							familyName={familyName}
						/>
					))}
				</div>
			)}
		</>
	);
}
