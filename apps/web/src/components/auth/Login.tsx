import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from '@tanstack/react-router';

export function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      router.navigate({ to: '/' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label htmlFor='username' className='block text-sm font-medium mb-2 text-charcoal'>
          Username
        </label>
        <input
          id='username'
          className='w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:outline-none transition-all'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder='Enter your username'
        />
      </div>
      <div>
        <label htmlFor='password' className='block text-sm font-medium mb-2 text-charcoal'>
          Password
        </label>
        <input
          id='password'
          type='password'
          className='w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:outline-none transition-all'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='••••••••'
        />
      </div>
      {error && <p className='text-destructive text-sm'>{error}</p>}
      <button
        type='submit'
        className='w-full py-3 px-4 bg-primary text-white font-heading font-semibold rounded-xl hover:bg-primary/90 shadow-nurture transition-all transform active:scale-[0.98]'>
        Sign In
      </button>
    </form>
  );
}
