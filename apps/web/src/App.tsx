import { StrictMode } from 'react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { useAuth } from './hooks/useAuth';

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // We'll inject this via provider if needed
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const auth = useAuth();

  return <RouterProvider router={router} context={{ auth }} />;
}

export default App;
