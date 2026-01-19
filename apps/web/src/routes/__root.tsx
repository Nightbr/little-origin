import { createRootRouteWithContext, Outlet, ScrollRestoration, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { MatchNotification } from '@/components/match/MatchNotification';
import { useAuth } from '@/hooks/useAuth';

export interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    isInitialized: boolean;
    user: { id: string; username: string } | null;
    logout: () => Promise<void>;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const isAuthPage = ['/login', '/onboarding'].includes(pathname);

  return (
    <>
      <ScrollRestoration />
      <div className='min-h-screen bg-background text-foreground font-sans selection:bg-primary/30'>
        {isAuthenticated && !isAuthPage && <GlobalHeader />}
        <main
          className={`relative flex flex-col ${pathname === '/' ? 'h-screen' : 'min-h-screen'} ${!isAuthPage ? 'pt-20' : ''} overflow-hidden`}>
          <Outlet />
        </main>
        {!isAuthPage && <MatchNotification />}
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
