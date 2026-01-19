import { Link } from '@tanstack/react-router';
import { BurgerMenu } from './BurgerMenu';

export function GlobalHeader() {
  return (
    <header className='fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-sage-green/10 px-6 py-4'>
      <div className='max-w-7xl mx-auto flex justify-between items-center'>
        <Link to='/' className='text-2xl font-heading text-primary hover:opacity-80 transition-opacity'>
          Little Origin
        </Link>
        <BurgerMenu />
      </div>
    </header>
  );
}
