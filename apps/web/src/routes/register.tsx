import { createFileRoute, redirect } from '@tanstack/react-router';
import { Register } from '@/components/auth/Register';
import { AuthLayout } from '@/components/layout/AuthLayout';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (localStorage.getItem('token')) {
      throw redirect({ to: '/' });
    }
  },
  component: () => (
    <AuthLayout>
      <Register />
    </AuthLayout>
  ),
});
