import { AdvancedIngestion, PruneDatabase } from '@/components/advanced';
import { INGESTION_STATUS_QUERY } from '@/graphql/operations';
import { useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/advanced')({
	beforeLoad: ({ context }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: AdvancedPage,
});

function AdvancedPage() {
	const { refetch } = useQuery(INGESTION_STATUS_QUERY, {
		fetchPolicy: 'network-only',
	});

	return (
		<div className="p-8 max-w-2xl mx-auto w-full">
			<header className="mb-8">
				<h1 className="text-4xl font-heading text-primary mb-2">Advanced Settings</h1>
				<p className="text-muted-foreground">
					Load extended baby name datasets from external sources.
				</p>
			</header>
			<div className="space-y-12">
				<AdvancedIngestion />
				<hr className="border-sage-green/20" />
				<PruneDatabase onSuccess={refetch} />
			</div>
		</div>
	);
}
