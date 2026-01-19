export interface NameData {
	country: string;
	countryName: string;
	male: string[];
	female: string[];
}

export interface NameEntry {
	name: string;
	gender: 'male' | 'female';
	country: string;
}
