import type { FilterState } from '@/hooks/useListFilter';
import { SUPPORTED_COUNTRIES } from '@little-origin/core';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface ListFiltersProps {
	filters: FilterState;
	setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
	hasActiveFilters: boolean;
	activeFilterCount: number;
	clearFilters: () => void;
}

export function ListFilters({
	filters,
	setFilters,
	hasActiveFilters,
	activeFilterCount,
	clearFilters,
}: ListFiltersProps) {
	const [showFilters, setShowFilters] = useState(false);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setFilters((prev) => ({ ...prev, search: e.target.value }));
		},
		[setFilters],
	);

	const handleGenderChange = useCallback(
		(gender: FilterState['gender']) => {
			setFilters((prev) => ({ ...prev, gender }));
		},
		[setFilters],
	);

	const toggleCountry = useCallback(
		(code: string) => {
			setFilters((prev) => {
				const next = prev.countries.includes(code)
					? prev.countries.filter((c) => c !== code)
					: [...prev.countries, code];
				return { ...prev, countries: next };
			});
		},
		[setFilters],
	);

	return (
		<div className="mb-6 space-y-3">
			{/* Search Bar + Filter Button (inline on mobile) */}
			<div className="flex gap-2 items-stretch">
				<div className="relative flex-1">
					<Search
						size={18}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						type="text"
						value={filters.search}
						onChange={handleSearchChange}
						placeholder="Search names..."
						className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
					/>
					{filters.search && (
						<button
							type="button"
							onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-charcoal"
						>
							<X size={16} />
						</button>
					)}
				</div>

				{/* Filter Toggle Button (Mobile only) */}
				<button
					type="button"
					onClick={() => setShowFilters(!showFilters)}
					className={`flex items-center gap-1.5 px-3 py-3 rounded-xl border transition-all md:hidden ${
						showFilters || hasActiveFilters
							? 'bg-primary text-white border-primary'
							: 'bg-white text-charcoal border-border hover:bg-calm-ivory'
					}`}
				>
					<Filter size={16} />
					{activeFilterCount > 0 && (
						<span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
							{activeFilterCount}
						</span>
					)}
					<ChevronDown
						size={14}
						className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
					/>
				</button>
			</div>

			{/* Clear All (Mobile, shown below when filters active) */}
			{hasActiveFilters && (
				<div className="md:hidden">
					<button
						type="button"
						onClick={clearFilters}
						className="text-sm text-muted-foreground hover:text-charcoal transition-colors"
					>
						Clear all filters
					</button>
				</div>
			)}

			{/* Filter Panel - Collapsible on mobile, always visible on desktop */}
			<div
				className={`space-y-4 md:block ${showFilters ? 'block animate-in slide-in-from-top-2 fade-in duration-200' : 'hidden'}`}
			>
				{/* Gender Filter */}
				<div>
					<h4 className="text-xs font-bold text-charcoal/60 uppercase tracking-wide mb-2">
						Gender
					</h4>
					<div className="flex gap-2">
						{(['all', 'male', 'female'] as const).map((g) => (
							<button
								type="button"
								key={g}
								onClick={() => handleGenderChange(g)}
								className={`flex-1 py-2.5 rounded-xl font-medium capitalize transition-all border text-sm ${
									filters.gender === g
										? 'bg-primary text-white border-primary shadow-sm'
										: 'bg-white text-charcoal border-border hover:bg-calm-ivory'
								}`}
							>
								{g}
							</button>
						))}
					</div>
				</div>

				{/* Country Filter */}
				<div>
					<h4 className="text-xs font-bold text-charcoal/60 uppercase tracking-wide mb-2">
						Country
					</h4>
					<div className="flex flex-wrap gap-2">
						{SUPPORTED_COUNTRIES.map((c) => (
							<button
								type="button"
								key={c.code}
								onClick={() => toggleCountry(c.code)}
								className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
									filters.countries.includes(c.code)
										? 'bg-primary text-white border-primary shadow-sm'
										: 'bg-white text-charcoal border-border hover:bg-calm-ivory'
								}`}
							>
								{c.name}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Desktop: Clear button inline */}
			{hasActiveFilters && (
				<div className="hidden md:block">
					<button
						type="button"
						onClick={clearFilters}
						className="text-sm text-muted-foreground hover:text-charcoal transition-colors"
					>
						Clear all filters
					</button>
				</div>
			)}
		</div>
	);
}

interface ListCounterProps {
	totalCount: number;
	filteredCount: number;
	hasActiveFilters: boolean;
	itemName?: string;
}

export function ListCounter({
	totalCount,
	filteredCount,
	hasActiveFilters,
	itemName = 'names',
}: ListCounterProps) {
	if (!hasActiveFilters) {
		return (
			<p className="text-muted-foreground">
				{totalCount} {itemName}
			</p>
		);
	}

	return (
		<p className="text-muted-foreground">
			Showing <span className="font-semibold text-charcoal">{filteredCount}</span> of {totalCount}{' '}
			{itemName}
		</p>
	);
}
