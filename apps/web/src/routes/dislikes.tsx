import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@apollo/client';
import { DISLIKED_NAMES_QUERY } from '@/graphql/operations';
import { HeartOff } from 'lucide-react';

export const Route = createFileRoute('/dislikes')({
  component: () => (
    <div className='p-8 max-w-4xl mx-auto w-full'>
      <header className='mb-12'>
        <h1 className='text-4xl font-heading text-sage-green mb-2'>Disliked Names</h1>
        <p className='text-muted-foreground'>Names that weren't quite right for you.</p>
      </header>
      <DislikesList />
    </div>
  ),
});

function DislikesList() {
  const { data, loading, error } = useQuery(DISLIKED_NAMES_QUERY, { fetchPolicy: 'network-only' });

  if (loading) return <div className='text-center py-20 animate-pulse text-sage-green'>Loading...</div>;
  if (error) return <div className='text-center py-20 text-destructive'>Error: {error.message}</div>;

  const names = data?.dislikedNames || [];

  if (names.length === 0) {
    return (
      <div className='text-center py-20 p-8 bg-white/50 border border-dashed border-sage-green/30 rounded-3xl'>
        <HeartOff size={48} className='mx-auto mb-4 text-sage-green/30' />
        <h3 className='text-2xl font-heading text-charcoal'>List is empty</h3>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {names.map((name: any) => (
        <div key={name.id} className='p-6 bg-white/50 rounded-2xl border border-border transition-all opacity-60 hover:opacity-100'>
          <h3 className='text-2xl font-heading text-charcoal/80'>{name.name}</h3>
          <p className='text-sm text-muted-foreground'>
            {name.gender} • {name.originCountry}
          </p>
        </div>
      ))}
    </div>
  );
}
