import { useIngestion } from '@/hooks/useIngestion';
import { CountryCard } from './CountryCard';

export function AdvancedIngestion() {
	const { countries, loading, error, isAnyIngesting, startIngestion } = useIngestion();

	if (loading) {
		return (
			<div className="text-center py-20 animate-pulse text-sage-green">
				Loading ingestion status...
			</div>
		);
	}

	if (error) {
		return <div className="text-center py-20 text-destructive">Error: {error.message}</div>;
	}

	return (
		<div className="space-y-4">
			{countries.map((country) => (
				<CountryCard
					key={country.country}
					country={country}
					onStart={() => startIngestion({ variables: { country: country.country } })}
					isAnyIngesting={isAnyIngesting}
				/>
			))}
		</div>
	);
}
