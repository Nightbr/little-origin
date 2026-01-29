import { useEffect, useMemo, useState } from 'react';

export interface FilterState {
	search: string;
	gender: 'all' | 'male' | 'female';
	countries: string[];
}

const DEFAULT_FILTER_STATE: FilterState = {
	search: '',
	gender: 'all',
	countries: [],
};

interface UseListFilterOptions<T> {
	items: T[];
	getName: (item: T) => string;
	getGender: (item: T) => string;
	getCountry: (item: T) => string;
	storageKey?: string;
}

export function useListFilter<T>({
	items,
	getName,
	getGender,
	getCountry,
	storageKey,
}: UseListFilterOptions<T>) {
	const [filters, setFilters] = useState<FilterState>(() => {
		if (storageKey) {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				try {
					return JSON.parse(saved);
				} catch (e) {
					console.error('Failed to parse filters from localStorage', e);
				}
			}
		}
		return DEFAULT_FILTER_STATE;
	});

	useEffect(() => {
		if (storageKey) {
			localStorage.setItem(storageKey, JSON.stringify(filters));
		}
	}, [filters, storageKey]);

	const filteredItems = useMemo(() => {
		return items.filter((item) => {
			// Search filter (case-insensitive partial match)
			if (filters.search) {
				const name = getName(item).toLowerCase();
				if (!name.includes(filters.search.toLowerCase())) {
					return false;
				}
			}

			// Gender filter
			if (filters.gender !== 'all') {
				const gender = getGender(item).toLowerCase();
				if (gender !== filters.gender) {
					return false;
				}
			}

			// Country filter (empty = all countries)
			if (filters.countries.length > 0) {
				const country = getCountry(item);
				if (!filters.countries.includes(country)) {
					return false;
				}
			}

			return true;
		});
	}, [items, filters, getName, getGender, getCountry]);

	const hasActiveFilters =
		filters.search !== '' || filters.gender !== 'all' || filters.countries.length > 0;

	const activeFilterCount =
		(filters.search ? 1 : 0) +
		(filters.gender !== 'all' ? 1 : 0) +
		(filters.countries.length > 0 ? 1 : 0);

	const clearFilters = () => setFilters(DEFAULT_FILTER_STATE);

	return {
		filters,
		setFilters,
		filteredItems,
		totalCount: items.length,
		filteredCount: filteredItems.length,
		hasActiveFilters,
		activeFilterCount,
		clearFilters,
	};
}
