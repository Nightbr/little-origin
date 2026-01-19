import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useRouter } from '@tanstack/react-router';

export function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, password);
      router.navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label className='block text-sm font-medium mb-2 text-charcoal'>Username</label>
        <input
          className='w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:outline-none transition-all'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder='Choose a username'
        />
      </div>
      <div>
        <label className='block text-sm font-medium mb-2 text-charcoal'>Password</label>
        <input
          type='password'
          className='w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:outline-none transition-all'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='Minimum 8 characters'
        />
      </div>
      {error && <p className='text-destructive text-sm'>{error}</p>}
      <button className='w-full py-3 px-4 bg-primary text-white font-heading font-semibold rounded-xl hover:bg-primary/90 shadow-nurture transition-all transform active:scale-[0.98]'>
        Create Account
      </button>
      <div className='text-center text-sm text-muted-foreground'>
        Already have an account?{' '}
        <Link to='/login' className='text-primary hover:underline'>
          Log in
        </Link>
      </div>
    </form>
  );
}
