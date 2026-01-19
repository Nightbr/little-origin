import { SwipeView } from '@/components/swipe/SwipeView';
import { useAppStatus } from '@/hooks/useAppStatus';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
	beforeLoad: ({ context }) => {
		// If not authenticated, redirect to login (will be handled by login page to check onboarding)
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: IndexPage,
});

function IndexPage() {
	const router = useRouter();
	const { needsOnboarding, loading } = useAppStatus();

	useEffect(() => {
		if (!loading && needsOnboarding) {
			router.navigate({ to: '/onboarding' });
		}
	}, [needsOnboarding, loading, router]);

	// Show loading state while checking
	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	// If needs onboarding, don't render (will redirect)
	if (needsOnboarding) {
		return null;
	}

	return <SwipeView />;
}
