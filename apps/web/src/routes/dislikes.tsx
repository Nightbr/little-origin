import { NameCard } from '@/components/lists/NameCard';
import { DISLIKED_NAMES_QUERY, GET_PREFERENCES_QUERY } from '@/graphql/operations';
import { useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { HeartOff } from 'lucide-react';

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
		<div className="p-8 max-w-4xl mx-auto w-full">
			<header className="mb-12">
				<h1 className="text-4xl font-heading text-sage-green mb-2">Disliked Names</h1>
				<p className="text-muted-foreground">Names that weren't quite right for you.</p>
			</header>
			<DislikesList />
		</div>
	),
});

function DislikesList() {
	const { data, loading, error } = useQuery(DISLIKED_NAMES_QUERY, { fetchPolicy: 'network-only' });
	const { data: prefsData } = useQuery(GET_PREFERENCES_QUERY);
	const familyName = prefsData?.preferences?.familyName || '';

	if (loading)
		return <div className="text-center py-20 animate-pulse text-sage-green">Loading...</div>;
	if (error)
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;

	const names = data?.dislikedNames || [];

	if (names.length === 0) {
		return (
			<div className="text-center py-20 p-8 bg-white/50 border border-dashed border-sage-green/30 rounded-3xl">
				<HeartOff size={48} className="mx-auto mb-4 text-sage-green/30" />
				<h3 className="text-2xl font-heading text-charcoal">List is empty</h3>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
			{names.map((name: NameItem) => (
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
	);
}
