import { useEffect } from 'react';

interface DeleteUserDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	username: string;
	isCurrentUser: boolean;
	loading?: boolean;
}

export function DeleteUserDialog({
	isOpen,
	onClose,
	onConfirm,
	username,
	isCurrentUser,
	loading = false,
}: DeleteUserDialogProps) {
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					onClose();
				}
			}}
			role="presentation"
			tabIndex={-1}
		>
			<div
				className="bg-white rounded-3xl shadow-nurture max-w-md w-full p-8 animate-in zoom-in-95 duration-200"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === 'Escape') onClose();
				}}
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="dialog-title"
				aria-describedby="dialog-description"
			>
				<h2 id="dialog-title" className="text-2xl font-heading text-charcoal mb-4">
					Delete Family Member?
				</h2>

				<p id="dialog-description" className="text-muted-foreground mb-6">
					Are you sure you want to remove{' '}
					<span className="font-semibold text-charcoal">{username}</span>?
					{isCurrentUser && (
						<span className="block mt-2 text-destructive font-medium">
							You will be logged out and will need to create a new account to continue.
						</span>
					)}
					{!isCurrentUser && (
						<span className="block mt-2">
							Their reviews and matches will be removed. This action cannot be undone.
						</span>
					)}
				</p>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-6 py-3 rounded-xl border border-border text-charcoal font-semibold hover:bg-sage-green/10 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="flex-1 px-6 py-3 rounded-xl bg-destructive text-white font-semibold hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<>
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
								Deleting...
							</>
						) : (
							'Delete'
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
