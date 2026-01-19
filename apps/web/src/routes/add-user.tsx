import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION } from '@/graphql/operations';
import { UserPlus, Check } from 'lucide-react';

export const Route = createFileRoute('/add-user')({
  beforeLoad: ({ context }) => {
    // Must be logged in to add new users
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AddUserView,
});

function AddUserView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registerMutation] = useMutation(REGISTER_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerMutation({ variables: { username, password } });
      setSuccess(true);
      setUsername('');
      setPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-8 max-w-lg mx-auto w-full'>
      <header className='mb-12'>
        <h1 className='text-4xl font-heading text-primary mb-2'>Add Family Member</h1>
        <p className='text-muted-foreground'>Add another person to help choose your baby's name.</p>
      </header>

      <div className='bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-nurture border border-border/50'>
        {success ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-sage-green/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Check className='text-sage-green' size={32} />
            </div>
            <h2 className='text-xl font-heading text-charcoal mb-2'>User Added!</h2>
            <p className='text-muted-foreground'>The new family member can now log in and start swiping.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label htmlFor='username' className='block text-sm font-medium mb-2 text-charcoal'>
                Username
              </label>
              <input
                id='username'
                className='w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:outline-none transition-all'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='Choose a username'
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
                placeholder='Minimum 8 characters'
              />
            </div>
            {error && <p className='text-destructive text-sm'>{error}</p>}
            <button
              type='submit'
              disabled={loading || !username || !password}
              className={`w-full py-3 px-4 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 transition-all ${
                loading || !username || !password
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90 shadow-nurture'
              }`}>
              {loading ? (
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : (
                <>
                  <UserPlus size={20} />
                  Add Family Member
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
