import { Login } from '@/components/auth/Login';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAppStatus } from '@/hooks/useAppStatus';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/login')({
	beforeLoad: ({ context }) => {
		// If already authenticated, redirect to home
		if (context.auth.isAuthenticated) {
			throw redirect({ to: '/' });
		}
	},
	component: LoginPage,
});

function LoginPage() {
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
			<AuthLayout>
				<div className="flex items-center justify-center py-12">
					<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</AuthLayout>
		);
	}

	// If needs onboarding, don't render login (will redirect)
	if (needsOnboarding) {
		return null;
	}

	return (
		<AuthLayout>
			<Login />
		</AuthLayout>
	);
}
