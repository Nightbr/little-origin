import { ALL_USERS_QUERY, REGISTER_MUTATION } from '@/graphql/operations';
import { useMutation, useQuery } from '@apollo/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Check, User, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

interface UserData {
	id: string;
	username: string;
}

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

	const users = usersData?.allUsers ?? [];

	return (
		<div className="p-8 max-w-lg mx-auto w-full">
			<header className="mb-8">
				<h1 className="text-4xl font-heading text-primary mb-2">Add Family Member</h1>
				<p className="text-muted-foreground">Add another person to help choose your baby's name.</p>
			</header>

			{/* Current Users Section */}
			{users.length > 0 && (
				<div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-nurture border border-border/50 mb-6">
					<div className="flex items-center gap-2 mb-4">
						<Users size={20} className="text-primary" />
						<h2 className="text-lg font-heading text-charcoal">Family Members</h2>
					</div>
					<div className="flex flex-wrap gap-2">
						{users.map((user) => (
							<div
								key={user.id}
								className="flex items-center gap-2 px-4 py-2 bg-sage-green/20 rounded-full text-sage-green font-medium"
							>
								<User size={16} />
								{user.username}
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
						<h2 className="text-xl font-heading text-charcoal mb-2">User Added!</h2>
						<p className="text-muted-foreground">
							The new family member can now log in and start swiping.
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
