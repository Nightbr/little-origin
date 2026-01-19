import { useState } from 'react';
import { UserPlus, Check } from 'lucide-react';

type OnboardingUser = { id: string; username: string };

interface UserStepProps {
  users: OnboardingUser[];
  onAddUser: (username: string, password: string) => Promise<boolean>;
  error: string;
}

export function UserStep({ users, onAddUser, error }: UserStepProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    const success = await onAddUser(username, password);
    if (success) {
      setUsername('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-heading text-primary mb-2'>Welcome to Little Origin</h2>
        <p className='text-muted-foreground'>Add family members who will help choose your baby's name.</p>
      </div>

      {/* Added users list */}
      {users.length > 0 && (
        <div className='space-y-2'>
          <p className='text-sm font-medium text-charcoal'>Added users:</p>
          <div className='flex flex-wrap gap-2'>
            {users.map((user) => (
              <div key={user.id} className='flex items-center gap-2 px-4 py-2 bg-sage-green/20 rounded-full text-sage-green font-medium'>
                <Check size={16} />
                {user.username}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add user form */}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-2 text-charcoal'>Username</label>
          <input
            className='w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:outline-none transition-all'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder='Enter username'
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
        <button
          type='submit'
          disabled={loading || !username || !password}
          className={`w-full py-3 px-4 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 transition-all ${
            loading || !username || !password
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-sage-green text-white hover:bg-sage-green/90 shadow-nurture'
          }`}>
          {loading ? (
            <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
          ) : (
            <>
              <UserPlus size={20} />
              Add User
            </>
          )}
        </button>
      </form>

      <p className='text-center text-sm text-muted-foreground'>
        {users.length === 0 ? 'Add at least one user to continue.' : `${users.length} user(s) added. Add more or continue.`}
      </p>
    </div>
  );
}
