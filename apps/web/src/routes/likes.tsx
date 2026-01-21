import { type Gender, GenderBadge } from '@/components/ui/GenderBadge';
import { GET_PREFERENCES_QUERY, LIKED_NAMES_QUERY } from '@/graphql/operations';
import { useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Heart } from 'lucide-react';

interface NameItem {
	id: string;
	name: string;
	gender: Gender;
	originCountry: string;
}

export const Route = createFileRoute('/likes')({
	beforeLoad: ({ context }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: () => (
		<div className="p-8 max-w-4xl mx-auto w-full">
			<header className="mb-12">
				<h1 className="text-4xl font-heading text-primary mb-2">Liked Names</h1>
				<p className="text-muted-foreground">The names that stole your heart.</p>
			</header>
			<LikesList />
		</div>
	),
});

function LikesList() {
	const { data, loading, error } = useQuery(LIKED_NAMES_QUERY, { fetchPolicy: 'network-only' });
	const { data: prefsData } = useQuery(GET_PREFERENCES_QUERY);
	const familyName = prefsData?.preferences?.familyName || '';

	if (loading)
		return (
			<div className="text-center py-20 animate-pulse text-sage-green">
				Loading your favorites...
			</div>
		);
	if (error)
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;

	const names = data?.likedNames || [];

	if (names.length === 0) {
		return (
			<div className="text-center py-20 p-8 bg-white/50 border border-dashed border-sage-green/30 rounded-3xl">
				<Heart size={48} className="mx-auto mb-4 text-sage-green/30" />
				<h3 className="text-2xl font-heading text-charcoal mb-2">No likes yet</h3>
				<p className="text-muted-foreground">Keep swiping to find the perfect name!</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{names.map((name: NameItem) => (
				<div
					key={name.id}
					className="p-6 bg-white rounded-2xl border border-border shadow-nurture transition-all hover:scale-[1.02]"
				>
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-2xl font-heading text-charcoal">
							{name.name}
							{familyName && <span className="text-charcoal/70"> {familyName}</span>}
						</h3>
						<GenderBadge gender={name.gender} size="md" />
					</div>
					<p className="text-muted-foreground text-sm">{name.originCountry}</p>
				</div>
			))}
		</div>
	);
}
