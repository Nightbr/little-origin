import { type Gender, GenderBadge } from '@/components/ui/GenderBadge';
import { ALL_MATCHES_QUERY, MATCH_CREATED_SUBSCRIPTION } from '@/graphql/operations';
import { useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { PartyPopper, Users } from 'lucide-react';
import { useEffect } from 'react';

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
		<div className="p-8 max-w-4xl mx-auto w-full">
			<header className="mb-12">
				<h1 className="text-4xl font-heading text-primary mb-2">Your Matches</h1>
				<p className="text-muted-foreground">The names you and your group both love!</p>
			</header>
			<MatchesList />
		</div>
	),
});

function MatchesList() {
	const { data, loading, error, subscribeToMore } = useQuery(ALL_MATCHES_QUERY, {
		fetchPolicy: 'network-only',
	});

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

	if (loading)
		return (
			<div className="text-center py-20 animate-pulse text-sage-green">Finding matches...</div>
		);
	if (error)
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;

	const matches = data?.allMatches || [];

	if (matches.length === 0) {
		return (
			<div className="text-center py-20 p-8 bg-white/50 border border-dashed border-sage-green/30 rounded-3xl">
				<Users size={48} className="mx-auto mb-4 text-sage-green/30" />
				<h3 className="text-2xl font-heading text-charcoal mb-2">No matches yet</h3>
				<p className="text-muted-foreground">Invite others to your circle to see shared likes!</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{matches.map((match: MatchItem) => (
				<div
					key={match.id}
					className="p-8 bg-white rounded-3xl border border-border shadow-nurture-lg relative overflow-hidden group"
				>
					<div className="absolute top-0 right-0 p-4">
						<PartyPopper className="text-primary/20 group-hover:scale-125 transition-transform" />
					</div>
					<div className="flex flex-col gap-4">
						<div className="flex items-start justify-between">
							<h3 className="text-4xl font-heading text-primary">{match.name.name}</h3>
							<GenderBadge gender={match.name.gender} size="md" />
						</div>

						<div className="flex flex-wrap items-center gap-2 mt-2">
							<span className="text-sm font-bold text-charcoal/40 mr-2">LIKED BY:</span>
							{match.likedBy.map((user: MatchUser) => (
								<span
									key={user.username}
									className="px-3 py-1 bg-calm-ivory text-charcoal rounded-full text-sm font-semibold border border-sage-green/10"
								>
									{user.username}
								</span>
							))}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
