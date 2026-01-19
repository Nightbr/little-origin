import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useAppStatus } from '@/hooks/useAppStatus';
import { createFileRoute } from '@tanstack/react-router';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/onboarding')({
	component: OnboardingPage,
});

function OnboardingPage() {
	const router = useRouter();
	const { isOnboardingComplete, loading } = useAppStatus();

	useEffect(() => {
		// If onboarding is already complete, redirect to login
		if (!loading && isOnboardingComplete) {
			router.navigate({ to: '/login' });
		}
	}, [isOnboardingComplete, loading, router]);

	// Show loading state while checking
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-calm-ivory via-background to-blush-pink/20">
				<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	// If onboarding complete, don't render (will redirect)
	if (isOnboardingComplete) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-calm-ivory via-background to-blush-pink/20">
			<OnboardingWizard />
		</div>
	);
}
