import { useSubscription } from '@apollo/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { MATCH_CREATED_SUBSCRIPTION } from '../../graphql/operations';

interface MatchUser {
	id: string;
	username: string;
}

interface MatchData {
	name: { name: string };
	likedBy: MatchUser[];
}

const CONFETTI_COLORS = [
	'#eab308',
	'#f97316',
	'#ef4444',
	'#ec4899',
	'#8b5cf6',
	'#3b82f6',
	'#10b981',
];
const CONFETTI_COUNT = 50;

interface ConfettiPiece {
	id: number;
	x: number;
	delay: number;
	duration: number;
	color: string;
	rotation: number;
	size: number;
}

function Confetti() {
	const pieces = useMemo<ConfettiPiece[]>(() => {
		return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			delay: Math.random() * 0.5,
			duration: 2 + Math.random() * 2,
			color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
			rotation: Math.random() * 360,
			size: 8 + Math.random() * 8,
		}));
	}, []);

	return (
		<div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
			{pieces.map((piece) => (
				<motion.div
					key={piece.id}
					className="absolute"
					style={{
						left: `${piece.x}%`,
						top: -20,
						width: piece.size,
						height: piece.size * 0.6,
						backgroundColor: piece.color,
						borderRadius: '2px',
					}}
					initial={{
						y: -20,
						rotate: piece.rotation,
						opacity: 1,
					}}
					animate={{
						y: '100vh',
						rotate: piece.rotation + 720,
						opacity: [1, 1, 0],
					}}
					transition={{
						duration: piece.duration,
						delay: piece.delay,
						ease: 'easeIn',
					}}
				/>
			))}
		</div>
	);
}

export function MatchNotification() {
	const { data } = useSubscription(MATCH_CREATED_SUBSCRIPTION);
	const [show, setShow] = useState(false);
	const [match, setMatch] = useState<MatchData | null>(null);

	useEffect(() => {
		if (data?.matchCreated) {
			setMatch(data.matchCreated);
			setShow(true);
			const timer = setTimeout(() => setShow(false), 4000);
			return () => clearTimeout(timer);
		}
	}, [data]);

	return (
		<AnimatePresence>
			{show && match && (
				<>
					<Confetti />
					<motion.div
						className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<motion.div
							className="bg-card border-2 border-primary rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]"
							initial={{ scale: 0.8, y: 50 }}
							animate={{ scale: 1, y: 0 }}
							exit={{ scale: 0.8, y: 50 }}
						>
							<h2 className="text-4xl font-serif text-primary mb-2">It's a Match!</h2>
							<div className="text-6xl font-bold my-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
								{match.name.name}
							</div>
							<p className="text-muted-foreground mb-4">
								Liked by {match.likedBy.map((u) => u.username).join(' & ')}
							</p>
							<button
								type="button"
								onClick={() => setShow(false)}
								className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold"
							>
								Keep Swiping
							</button>
						</motion.div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
