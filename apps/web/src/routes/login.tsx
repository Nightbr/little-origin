import { createFileRoute, redirect } from '@tanstack/react-router';
import { Login } from '@/components/auth/Login';
import { AuthLayout } from '@/components/layout/AuthLayout';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (localStorage.getItem('token')) {
      throw redirect({ to: '/' });
    }
  },
  component: () => (
    <AuthLayout>
      <Login />
    </AuthLayout>
  ),
});
