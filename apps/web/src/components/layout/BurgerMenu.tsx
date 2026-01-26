import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
	Heart,
	HeartOff,
	Home,
	LogOut,
	Menu,
	Settings,
	UserPlus,
	Users,
	X,
	Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const baseMenuItems = [
	{ label: 'Home', icon: Home, to: '/' },
	{ label: 'Liked Names', icon: Heart, to: '/likes' },
	{ label: 'Disliked Names', icon: HeartOff, to: '/dislikes' },
	{ label: 'Matches', icon: Users, to: '/matches' },
	{ label: 'Preferences', icon: Settings, to: '/preferences' },
	{ label: 'Add Member', icon: UserPlus, to: '/add-user' },
];

const advancedMenuItem = { label: 'Advanced', icon: Zap, to: '/advanced' };

export function BurgerMenu() {
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [tapCount, setTapCount] = useState(0);
	const [advancedVisible, setAdvancedVisible] = useState(false);
	const { logout, user } = useAuth();
	const router = useRouter();

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	const toggleMenu = () => setIsOpen(!isOpen);

	// Reset tap count after 2 seconds of inactivity
	useEffect(() => {
		if (tapCount > 0) {
			const timeout = setTimeout(() => setTapCount(0), 2000);
			return () => clearTimeout(timeout);
		}
	}, [tapCount]);

	const handleFooterTap = () => {
		const newCount = tapCount + 1;
		setTapCount(newCount);
		if (newCount >= 5) {
			setAdvancedVisible(true);
			setTapCount(0);
		}
	};

	const handleLogout = async () => {
		await logout();
		router.navigate({ to: '/login' });
		setIsOpen(false);
	};

	const menuItems = advancedVisible ? [...baseMenuItems, advancedMenuItem] : baseMenuItems;

	const menuContent = (
		<>
			{/* Overlay */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={toggleMenu}
						className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[100]"
					/>
				)}
			</AnimatePresence>

			{/* Slide-out Menu */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
						className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[101] p-8 flex flex-col"
					>
						<div className="mb-12">
							<h2 className="text-3xl font-heading text-primary mb-2">Little Origin</h2>
							<p className="text-muted-foreground">Welcome, {user?.username}</p>
						</div>

						<nav className="flex-1 space-y-2">
							{menuItems.map((item) => (
								<Link
									key={item.to}
									to={item.to}
									onClick={toggleMenu}
									className={cn(
										'flex items-center gap-4 p-4 rounded-2xl text-charcoal transition-all hover:bg-calm-ivory group',
										'[&.active]:bg-sage-green/10 [&.active]:text-primary',
									)}
								>
									<item.icon className="group-hover:scale-110 transition-transform" size={20} />
									<span className="font-heading font-semibold">{item.label}</span>
								</Link>
							))}
						</nav>

						<button
							type="button"
							onClick={handleLogout}
							className="flex items-center gap-4 p-4 rounded-2xl text-destructive transition-all hover:bg-destructive/5 group mt-auto"
						>
							<LogOut className="group-hover:translate-x-1 transition-transform" size={20} />
							<span className="font-heading font-semibold">Logout</span>
						</button>
						<button
							type="button"
							onClick={handleFooterTap}
							className="text-sm text-muted-foreground/70 text-center mt-4 cursor-pointer hover:text-muted-foreground transition-colors"
						>
							Built with ❤️ for new parents
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);

	return (
		<>
			<button
				type="button"
				onClick={toggleMenu}
				className="p-2 bg-calm-ivory rounded-xl text-charcoal hover:scale-105 active:scale-95 transition-all border border-sage-green/10"
				aria-label="Toggle Menu"
			>
				{isOpen ? <X size={24} /> : <Menu size={24} />}
			</button>
			{mounted && createPortal(menuContent, document.body)}
		</>
	);
}
