import { usePruneDatabase } from '@/hooks/usePruneDatabase';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface PruneDatabaseProps {
	onSuccess?: () => void;
}

export function PruneDatabase({ onSuccess }: PruneDatabaseProps) {
	const { prune, loading } = usePruneDatabase();
	const [confirming, setConfirming] = useState(false);
	const [deletedCount, setDeletedCount] = useState<number | null>(null);

	const handlePrune = async () => {
		if (!confirming) {
			setConfirming(true);
			return;
		}

		try {
			const count = await prune();
			setDeletedCount(count);
			setConfirming(false);

			// Refresh ingestion data to update loaded counts
			onSuccess?.();

			// Reset success message after 5 seconds
			setTimeout(() => setDeletedCount(null), 5000);
		} catch (error) {
			console.error('Prune failed:', error);
		}
	};

	return (
		<section className="space-y-4">
			<div className="flex items-start justify-between">
				<div>
					<h2 className="text-2xl font-heading text-charcoal mb-2">Prune Database</h2>
					<p className="text-muted-foreground max-w-xl">
						Remove imported names that haven't been liked or matched by any user. This cleans up the
						database by deleting unused "extended" source names, while protecting liked names,
						matches, and static data.
					</p>
				</div>
			</div>

			<div className="bg-white rounded-2xl p-6 border border-sage-green/10 shadow-sm flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
						<Trash2 size={24} />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-charcoal">Clean Unused Names</h3>
						<p className="text-sm text-muted-foreground">This action cannot be undone.</p>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{deletedCount !== null && (
						<span className="text-sm font-medium text-sage-green animate-in fade-in slide-in-from-right-4">
							Successfully removed {deletedCount.toLocaleString()} names
						</span>
					)}

					{deletedCount === null &&
						(confirming ? (
							<div className="flex gap-2 animate-in fade-in zoom-in-95">
								<button
									type="button"
									onClick={() => setConfirming(false)}
									className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/5"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handlePrune}
									disabled={loading}
									className="px-4 py-2 rounded-xl bg-destructive text-white font-medium hover:bg-destructive/90 flex items-center gap-2"
								>
									{loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
									Confirm Delete
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setConfirming(true)}
								className="px-6 py-3 rounded-xl border border-destructive/20 text-destructive font-semibold hover:bg-destructive/5 active:scale-95 transition-all"
							>
								Prune Database
							</button>
						))}
				</div>
			</div>
		</section>
	);
}
