import { RouterProvider, createRouter } from '@tanstack/react-router';
import { useAuth } from './hooks/useAuth';
import { routeTree } from './routeTree.gen';
import type { RouterContext } from './routes/__root';

const router = createRouter({
	routeTree,
	context: undefined as unknown as RouterContext,
	scrollRestoration: true,
});

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}

function LoadingScreen() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-calm-ivory via-background to-blush-pink/20">
			<div className="text-center">
				<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
				<p className="text-muted-foreground">Loading...</p>
			</div>
		</div>
	);
}

function App() {
	const auth = useAuth();

	// Show loading screen while auth is initializing
	if (!auth.isInitialized) {
		return <LoadingScreen />;
	}

	return <RouterProvider router={router} context={{ auth }} />;
}

export default App;
