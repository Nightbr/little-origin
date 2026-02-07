import { DeleteUserDialog } from '@/components/lists/DeleteUserDialog';
import { ALL_USERS_QUERY, DELETE_USER_MUTATION, REGISTER_MUTATION } from '@/graphql/operations';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Check, Trash2, User, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

interface UserData {
	id: string;
	username: string;
}

export const Route = createFileRoute('/members')({
	beforeLoad: ({ context }) => {
		// Must be logged in to add new users
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: MembersView,
});

function MembersView() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
	const [registerMutation] = useMutation(REGISTER_MUTATION);
	const [deleteUserMutation] = useMutation(DELETE_USER_MUTATION, {
		refetchQueries: [{ query: ALL_USERS_QUERY }],
	});
	const { user: currentUser, logout } = useAuth();
	const { data: usersData, refetch: refetchUsers } = useQuery<{ allUsers: UserData[] }>(
		ALL_USERS_QUERY,
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await registerMutation({ variables: { username, password } });
			setSuccess(true);
			setUsername('');
			setPassword('');
			await refetchUsers();
			setTimeout(() => setSuccess(false), 3000);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to add user';
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteClick = (userId: string) => {
		setDeleteUserId(userId);
	};

	const handleDeleteConfirm = async () => {
		if (!deleteUserId) return;

		const isCurrentUser = currentUser?.id === deleteUserId;
		setDeleting(true);
		setError('');

		try {
			await deleteUserMutation({ variables: { userId: deleteUserId } });

			if (isCurrentUser) {
				// Log out the deleted user
				await logout();
			} else {
				await refetchUsers();
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to delete user';
			setError(message);
		} finally {
			setDeleting(false);
			setDeleteUserId(null);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteUserId(null);
	};

	const users = usersData?.allUsers ?? [];
	const userToDelete = users.find((u) => u.id === deleteUserId);

	return (
		<div className="p-8 max-w-2xl mx-auto w-full">
			<header className="mb-8">
				<h1 className="text-4xl font-heading text-primary mb-2">Members</h1>
				<p className="text-muted-foreground">Add another person to help choose your baby's name.</p>
			</header>

			{/* Current Users Section */}
			{users.length > 0 && (
				<div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-nurture border border-border/50 mb-6">
					<div className="flex items-center gap-2 mb-4">
						<Users size={20} className="text-primary" />
						<h2 className="text-lg font-heading text-charcoal">Existing Members</h2>
					</div>
					<div className="flex flex-wrap gap-2">
						{users.map((user) => (
							<div
								key={user.id}
								className="flex items-center gap-2 px-4 py-2 bg-sage-green/20 rounded-full text-sage-green font-medium group relative"
							>
								<User size={16} />
								{user.username}
								<button
									type="button"
									onClick={() => handleDeleteClick(user.id)}
									disabled={users.length === 1}
									className="ml-1 p-1 hover:bg-destructive/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									aria-label={`Delete ${user.username}`}
								>
									<Trash2 size={14} className="text-sage-green/70 hover:text-destructive" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Add User Form */}
			<div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-nurture border border-border/50">
				{success ? (
					<div className="text-center py-8">
						<div className="w-16 h-16 bg-sage-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<Check className="text-sage-green" size={32} />
						</div>
						<h2 className="text-xl font-heading text-charcoal mb-2">Member Added!</h2>
						<p className="text-muted-foreground">
							The new member can now log in and start swiping.
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label htmlFor="username" className="block text-sm font-medium mb-2 text-charcoal">
								Username
							</label>
							<input
								id="username"
								className="w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:outline-none transition-all"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Choose a username"
							/>
						</div>
						<div>
							<label htmlFor="password" className="block text-sm font-medium mb-2 text-charcoal">
								Password
							</label>
							<input
								id="password"
								type="password"
								className="w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:outline-none transition-all"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Minimum 8 characters"
							/>
						</div>
						{error && <p className="text-destructive text-sm">{error}</p>}
						<button
							type="submit"
							disabled={loading || !username || !password}
							className={`w-full py-3 px-4 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 transition-all ${
								loading || !username || !password
									? 'bg-muted text-muted-foreground cursor-not-allowed'
									: 'bg-primary text-white hover:bg-primary/90 shadow-nurture'
							}`}
						>
							{loading ? (
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : (
								<>
									<UserPlus size={20} />
									Add Member
								</>
							)}
						</button>
					</form>
				)}
			</div>

			{userToDelete && (
				<DeleteUserDialog
					isOpen={!!deleteUserId}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					username={userToDelete.username}
					isCurrentUser={currentUser?.id === deleteUserId}
					loading={deleting}
				/>
			)}
		</div>
	);
}
