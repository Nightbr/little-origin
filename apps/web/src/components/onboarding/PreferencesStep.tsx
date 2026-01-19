import { SUPPORTED_COUNTRIES } from '@little-origin/core';

interface Preferences {
  countryOrigins: string[];
  genderPreference: 'male' | 'female' | 'both';
  maxCharacters: number;
}

interface PreferencesStepProps {
  preferences: Preferences;
  onPreferencesChange: (prefs: Preferences) => void;
}

export function PreferencesStep({ preferences, onPreferencesChange }: PreferencesStepProps) {
  const toggleCountry = (code: string) => {
    const next = preferences.countryOrigins.includes(code)
      ? preferences.countryOrigins.filter((c) => c !== code)
      : [...preferences.countryOrigins, code];
    if (next.length > 0) {
      onPreferencesChange({ ...preferences, countryOrigins: next });
    }
  };

  return (
    <div className='space-y-8'>
      <div className='text-center'>
        <h2 className='text-2xl font-heading text-primary mb-2'>Name Preferences</h2>
        <p className='text-muted-foreground'>Configure what kind of names you're looking for.</p>
      </div>

      {/* Gender */}
      <section>
        <h3 className='text-lg font-bold text-charcoal mb-4'>I'm looking for...</h3>
        <div className='grid grid-cols-3 gap-3'>
          {(['male', 'female', 'both'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onPreferencesChange({ ...preferences, genderPreference: g })}
              className={`py-4 rounded-2xl font-bold capitalize transition-all border ${
                preferences.genderPreference === g
                  ? 'bg-primary text-white border-primary shadow-nurture'
                  : 'bg-white text-charcoal border-border hover:bg-calm-ivory'
              }`}>
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Countries */}
      <section>
        <h3 className='text-lg font-bold text-charcoal mb-4'>Name Origins</h3>
        <div className='flex flex-wrap gap-2'>
          {SUPPORTED_COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => toggleCountry(c.code)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                preferences.countryOrigins.includes(c.code)
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-charcoal border-border hover:bg-calm-ivory'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Max Length */}
      <section>
        <div className='flex justify-between mb-4'>
          <h3 className='text-lg font-bold text-charcoal'>Max Name Length</h3>
          <span className='text-primary font-bold'>{preferences.maxCharacters} chars</span>
        </div>
        <input
          type='range'
          min='3'
          max='20'
          value={preferences.maxCharacters}
          onChange={(e) => onPreferencesChange({ ...preferences, maxCharacters: parseInt(e.target.value) })}
          className='w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-primary'
        />
      </section>
    </div>
  );
}
