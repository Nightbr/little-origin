import { SUPPORTED_COUNTRIES } from '@little-origin/core';
import { Settings, Sparkles, Users } from 'lucide-react';

type OnboardingUser = { id: string; username: string };

interface Preferences {
	countryOrigins: string[];
	genderPreference: 'male' | 'female' | 'both';
	maxCharacters: number;
	familyName: string;
}

interface ConfirmStepProps {
	users: OnboardingUser[];
	preferences: Preferences;
	onComplete: () => void;
	loading: boolean;
	error: string;
}

export function ConfirmStep({ users, preferences, onComplete, loading, error }: ConfirmStepProps) {
	const countryNames = preferences.countryOrigins
		.map((code) => SUPPORTED_COUNTRIES.find((c) => c.code === code)?.name || code)
		.join(', ');

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-heading text-primary mb-2">Ready to Start!</h2>
				<p className="text-muted-foreground">
					Review your setup and start finding the perfect name.
				</p>
			</div>

			{/* Summary */}
			<div className="space-y-4">
				<div className="flex items-start gap-4 p-4 bg-calm-ivory rounded-2xl">
					<Users className="text-sage-green mt-1" />
					<div>
						<h4 className="font-bold text-charcoal">Family Members</h4>
						<p className="text-muted-foreground">{users.map((u) => u.username).join(', ')}</p>
					</div>
				</div>

				<div className="flex items-start gap-4 p-4 bg-calm-ivory rounded-2xl">
					<Settings className="text-sage-green mt-1" />
					<div>
						<h4 className="font-bold text-charcoal">Preferences</h4>
						<p className="text-muted-foreground">
							{preferences.genderPreference === 'both'
								? 'All genders'
								: `${preferences.genderPreference} names only`}
							<br />
							Origins: {countryNames}
							<br />
							Max length: {preferences.maxCharacters} characters
							{preferences.familyName && (
								<>
									<br />
									Family name: {preferences.familyName}
								</>
							)}
						</p>
					</div>
				</div>
			</div>

			{error && <p className="text-destructive text-sm text-center">{error}</p>}

			<button
				type="button"
				onClick={onComplete}
				disabled={loading}
				className={`w-full py-4 rounded-2xl font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all ${
					loading
						? 'bg-primary/70 text-white cursor-wait'
						: 'bg-primary text-white hover:bg-primary/90 shadow-nurture active:scale-[0.98]'
				}`}
			>
				{loading ? (
					<>
						<div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
						Setting up...
					</>
				) : (
					<>
						<Sparkles size={24} />
						Complete Setup
					</>
				)}
			</button>

			<p className="text-center text-sm text-muted-foreground">
				This will seed the name database and prepare your experience.
			</p>
		</div>
	);
}
