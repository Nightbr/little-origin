import { createFileRoute, redirect } from '@tanstack/react-router';
import { SwipeView } from '@/components/swipe/SwipeView';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }: any) => {
    if (!context.auth.isAuthenticated && !localStorage.getItem('token')) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: SwipeView,
});
