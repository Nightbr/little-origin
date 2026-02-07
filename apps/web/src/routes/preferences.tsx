import { GET_PREFERENCES_QUERY, UPDATE_PREFERENCES_MUTATION } from '@/graphql/operations';
import { useMutation, useQuery } from '@apollo/client';
import { SUPPORTED_COUNTRIES } from '@little-origin/core';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Check, Save, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PreferencesFormData {
	countryOrigins: string[];
	genderPreference: string;
	maxCharacters: number;
	familyName: string;
}

export const Route = createFileRoute('/preferences')({
	beforeLoad: ({ context }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: PreferencesView,
});

function PreferencesView() {
	const { data, loading, error } = useQuery(GET_PREFERENCES_QUERY, {
		fetchPolicy: 'network-only',
	});
	const [updatePrefs] = useMutation(UPDATE_PREFERENCES_MUTATION);
	const [formData, setFormData] = useState<PreferencesFormData | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [errorState, setErrorState] = useState(false);

	useEffect(() => {
		if (data?.preferences) {
			setFormData({
				countryOrigins: data.preferences.countryOrigins,
				genderPreference: data.preferences.genderPreference,
				maxCharacters: data.preferences.maxCharacters,
				familyName: data.preferences.familyName ?? '',
			});
		}
	}, [data]);

	const toggleCountry = (code: string) => {
		if (!formData) return;
		const next = formData.countryOrigins.includes(code)
			? formData.countryOrigins.filter((c: string) => c !== code)
			: [...formData.countryOrigins, code];
		if (next.length > 0) {
			setFormData({ ...formData, countryOrigins: next });
		}
	};

	const handleSave = async () => {
		setSaving(true);
		setErrorState(false);
		try {
			await updatePrefs({
				variables: { input: formData },
				update(cache, { data }) {
					if (data?.updatePreferences) {
						cache.writeQuery({
							query: GET_PREFERENCES_QUERY,
							data: { preferences: data.updatePreferences },
						});
					}
				},
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch (err) {
			console.error(err);
			setErrorState(true);
			setTimeout(() => setErrorState(false), 3000);
		} finally {
			setSaving(false);
		}
	};

	if (loading || !formData)
		return (
			<div className="text-center py-20 animate-pulse text-sage-green">Loading preferences...</div>
		);
	if (error)
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;

	return (
		<div className="p-8 max-w-2xl mx-auto w-full">
			<header className="mb-8">
				<h1 className="text-4xl font-heading text-primary mb-2">Preferences</h1>
				<p className="text-muted-foreground">Adjust your baby name search.</p>
			</header>

			<div className="space-y-12">
				{/* Gender */}
				<section>
					<h3 className="text-lg font-bold text-charcoal mb-4">I'm looking for...</h3>
					<div className="grid grid-cols-3 gap-3">
						{['male', 'female', 'both'].map((g) => (
							<button
								type="button"
								key={g}
								onClick={() => setFormData({ ...formData, genderPreference: g })}
								className={`py-4 rounded-2xl font-bold capitalize transition-all border ${
									formData.genderPreference === g
										? 'bg-primary text-white border-primary shadow-nurture'
										: 'bg-white text-charcoal border-border hover:bg-calm-ivory'
								}`}
							>
								{g}
							</button>
						))}
					</div>
				</section>

				{/* Countries */}
				<section>
					<h3 className="text-lg font-bold text-charcoal mb-4">Origins</h3>
					<div className="flex flex-wrap gap-2">
						{SUPPORTED_COUNTRIES.map((c) => (
							<button
								type="button"
								key={c.code}
								onClick={() => toggleCountry(c.code)}
								className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
									formData.countryOrigins.includes(c.code)
										? 'bg-primary text-white border-primary shadow-sm'
										: 'bg-white text-charcoal border-border hover:bg-calm-ivory'
								}`}
							>
								{c.name}
							</button>
						))}
					</div>
				</section>

				{/* Max Length */}
				<section>
					<div className="flex justify-between mb-4">
						<h3 className="text-lg font-bold text-charcoal">Max Name Length</h3>
						<span className="text-primary font-bold">{formData.maxCharacters} chars</span>
					</div>
					<input
						type="range"
						min="3"
						max="20"
						value={formData.maxCharacters}
						onChange={(e) =>
							setFormData({ ...formData, maxCharacters: Number.parseInt(e.target.value) })
						}
						className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-primary"
					/>
				</section>

				{/* Family Name */}
				<section>
					<h3 className="text-lg font-bold text-charcoal mb-4">Family Name</h3>
					<input
						type="text"
						value={formData.familyName}
						onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
						placeholder="Enter your family name (optional)"
						className="w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:border-transparent"
					/>
					<p className="text-xs text-muted-foreground mt-2">
						Will be displayed below names on cards and in lists
					</p>
				</section>

				<button
					type="button"
					onClick={handleSave}
					disabled={saving}
					className={`w-full py-4 rounded-2xl font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all ${
						saved
							? 'bg-success text-success-foreground'
							: errorState
								? 'bg-destructive text-destructive-foreground'
								: 'bg-primary text-white hover:bg-primary/90 shadow-nurture active:scale-[0.98]'
					}`}
				>
					{saving ? (
						<div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
					) : saved ? (
						<>
							<Check size={24} />
							Saved!
						</>
					) : errorState ? (
						<>
							<Settings size={24} />
							Error saving
						</>
					) : (
						<>
							<Save size={24} />
							Save Changes
						</>
					)}
				</button>
			</div>
		</div>
	);
}
