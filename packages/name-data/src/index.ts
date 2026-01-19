import namesUS from '../data/names-us.json';
import namesGB from '../data/names-gb.json';
import namesFR from '../data/names-fr.json';
import namesIT from '../data/names-it.json';
import namesDE from '../data/names-de.json';
import namesES from '../data/names-es.json';
import namesIE from '../data/names-ie.json';
import type { NameData, NameEntry } from './types';

const namesByCountry: Record<string, NameData> = {
  US: namesUS,
  GB: namesGB,
  FR: namesFR,
  IT: namesIT,
  DE: namesDE,
  ES: namesES,
  IE: namesIE,
};

export function getNamesByCountries(countryCodes: string[], gender: 'male' | 'female' | 'both', maxLength?: number): NameEntry[] {
  const results: NameEntry[] = [];
  const normalizedGender = gender.toLowerCase();

  for (const code of countryCodes) {
    const data = namesByCountry[code];
    if (!data) continue;

    if (normalizedGender === 'male' || normalizedGender === 'both') {
      data.male.forEach((name) => {
        if (!maxLength || name.length <= maxLength) {
          results.push({ name, gender: 'male', country: code });
        }
      });
    }

    if (normalizedGender === 'female' || normalizedGender === 'both') {
      data.female.forEach((name) => {
        if (!maxLength || name.length <= maxLength) {
          results.push({ name, gender: 'female', country: code });
        }
      });
    }
  }

  return results;
}

export function getAllCountries(): Array<{ code: string; name: string }> {
  return Object.entries(namesByCountry).map(([code, data]) => ({
    code,
    name: data.countryName,
  }));
}

export function getCountryName(code: string): string | null {
  return namesByCountry[code]?.countryName || null;
}

export * from './types';
