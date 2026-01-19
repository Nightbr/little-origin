import { useSubscription } from '@apollo/client';
import { MATCH_CREATED_SUBSCRIPTION } from '../../graphql/operations';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function MatchNotification() {
	const { data } = useSubscription(MATCH_CREATED_SUBSCRIPTION);
	const [show, setShow] = useState(false);
	const [match, setMatch] = useState<any>(null);

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
							Liked by {match.likedBy.map((u: any) => u.username).join(' & ')}
						</p>
						<button
							onClick={() => setShow(false)}
							className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold"
						>
							Keep Swiping
						</button>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
