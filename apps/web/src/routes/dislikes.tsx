import { ListCounter, ListFilters } from '@/components/lists/ListFilters';
import { NameCard } from '@/components/lists/NameCard';
import { DISLIKED_NAMES_QUERY, GET_PREFERENCES_QUERY } from '@/graphql/operations';
import { useListFilter } from '@/hooks/useListFilter';
import { useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { HeartOff } from 'lucide-react';
import { useCallback } from 'react';

interface NameItem {
	id: string;
	name: string;
	gender: string;
	originCountry: string;
}

export const Route = createFileRoute('/dislikes')({
	beforeLoad: ({ context }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: () => (
		<div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
			<DislikesList />
		</div>
	),
});

function DislikesList() {
	const { data, loading, error } = useQuery(DISLIKED_NAMES_QUERY, { fetchPolicy: 'network-only' });
	const { data: prefsData } = useQuery(GET_PREFERENCES_QUERY);
	const familyName = prefsData?.preferences?.familyName || '';

	const names: NameItem[] = data?.dislikedNames || [];

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
	} = useListFilter({ items: names, getName, getGender, getCountry });

	if (loading)
		return <div className="text-center py-20 animate-pulse text-sage-green">Loading...</div>;
	if (error)
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;

	return (
		<>
			<header className="mb-6">
				<h1 className="text-3xl sm:text-4xl font-heading text-sage-green mb-1">Disliked Names</h1>
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
					<HeartOff size={48} className="mx-auto mb-4 text-sage-green/30" />
					<h3 className="text-2xl font-heading text-charcoal">
						{hasActiveFilters ? 'No matches found' : 'List is empty'}
					</h3>
					{hasActiveFilters && (
						<p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
					)}
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
							isLiked={false}
							familyName={familyName}
						/>
					))}
				</div>
			)}
		</>
	);
}
