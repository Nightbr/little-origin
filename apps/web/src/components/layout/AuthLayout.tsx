import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground font-sans'>
      <div className='w-full max-w-md bg-card border border-border rounded-2xl shadow-nurture p-8'>
        <h1 className='text-4xl font-heading text-primary text-center mb-8'>Little Origin</h1>
        {children}
      </div>
    </div>
  );
}
