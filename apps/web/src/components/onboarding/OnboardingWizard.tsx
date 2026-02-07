import {
	ADD_ONBOARDING_USER_MUTATION,
	APP_STATUS_QUERY,
	COMPLETE_ONBOARDING_MUTATION,
	SAVE_ONBOARDING_PREFERENCES_MUTATION,
} from '@/graphql/operations';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ConfirmStep } from './ConfirmStep';
import { PreferencesStep } from './PreferencesStep';
import { UserStep } from './UserStep';

type OnboardingUser = { id: string; username: string };

interface Preferences {
	countryOrigins: string[];
	genderPreference: 'male' | 'female' | 'both';
	maxCharacters: number;
	familyName: string;
}

export function OnboardingWizard() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [users, setUsers] = useState<OnboardingUser[]>([]);
	const [preferences, setPreferences] = useState<Preferences>({
		countryOrigins: [],
		genderPreference: 'both',
		maxCharacters: 12,
		familyName: '',
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [savingPrefs, setSavingPrefs] = useState(false);

	const { refetch: refetchStatus } = useQuery(APP_STATUS_QUERY);
	const [addUser] = useMutation(ADD_ONBOARDING_USER_MUTATION);
	const [savePrefs] = useMutation(SAVE_ONBOARDING_PREFERENCES_MUTATION);
	const [completeOnboarding] = useMutation(COMPLETE_ONBOARDING_MUTATION);

	const handleAddUser = async (username: string, password: string) => {
		setError('');
		try {
			const res = await addUser({ variables: { username, password } });
			const newUser = res.data.addOnboardingUser;
			setUsers([...users, newUser]);
			await refetchStatus();
			return true;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to add user';
			setError(message);
			return false;
		}
	};

	const handleSavePreferences = async () => {
		setError('');
		try {
			await savePrefs({ variables: { input: preferences } });
			return true;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to save preferences';
			setError(message);
			return false;
		}
	};

	const handleComplete = async () => {
		setLoading(true);
		setError('');
		try {
			// Save preferences first
			await savePrefs({ variables: { input: preferences } });
			// Complete onboarding (seeds names)
			await completeOnboarding();
			// Redirect to login
			router.navigate({ to: '/login' });
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const canProceed = () => {
		if (step === 1) return users.length >= 1;
		if (step === 2) return preferences.countryOrigins.length > 0;
		return true;
	};

	const goNext = async () => {
		if (step === 2) {
			setSavingPrefs(true);
			const saved = await handleSavePreferences();
			setSavingPrefs(false);
			if (!saved) return;
		}
		if (step < 3) setStep(step + 1);
	};

	const goBack = () => {
		if (step > 1) setStep(step - 1);
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-lg">
				{/* Progress indicator */}
				<div className="flex items-center justify-center gap-2 mb-8">
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className={`w-3 h-3 rounded-full transition-colors ${
								s === step ? 'bg-primary scale-125' : s < step ? 'bg-primary/50' : 'bg-border'
							}`}
						/>
					))}
				</div>

				{/* Step content */}
				<div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-nurture border border-border/50">
					{step === 1 && <UserStep users={users} onAddUser={handleAddUser} error={error} />}
					{step === 2 && (
						<PreferencesStep preferences={preferences} onPreferencesChange={setPreferences} />
					)}
					{step === 3 && (
						<ConfirmStep
							users={users}
							preferences={preferences}
							onComplete={handleComplete}
							loading={loading}
							error={error}
						/>
					)}
				</div>

				{/* Navigation */}
				<div className="flex justify-between mt-6">
					<button
						type="button"
						onClick={goBack}
						disabled={step === 1}
						className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
							step === 1
								? 'text-muted-foreground cursor-not-allowed'
								: 'text-charcoal hover:bg-calm-ivory'
						}`}
					>
						<ChevronLeft size={20} />
						Back
					</button>

					{step < 3 ? (
						<button
							type="button"
							onClick={goNext}
							disabled={!canProceed() || (step === 2 && savingPrefs)}
							className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
								!canProceed() || (step === 2 && savingPrefs)
									? 'bg-muted text-muted-foreground cursor-not-allowed'
									: 'bg-primary text-white hover:bg-primary/90 shadow-nurture'
							}`}
						>
							{step === 2 && savingPrefs ? (
								<>
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									Saving...
								</>
							) : (
								<>
									Next
									<ChevronRight size={20} />
								</>
							)}
						</button>
					) : null}
				</div>
			</div>
		</div>
	);
}
