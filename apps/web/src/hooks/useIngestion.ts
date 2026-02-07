import {
	INGESTION_STATUS_QUERY,
	NAME_INGESTION_PROGRESS_SUBSCRIPTION,
	START_INGESTION_MUTATION,
} from '@/graphql/operations';
import type { CountryStatus } from '@/lib/ingestion';
import { useMutation, useQuery, useSubscription } from '@apollo/client';

export function useIngestion() {
	const { data, loading, error, refetch } = useQuery(INGESTION_STATUS_QUERY, {
		fetchPolicy: 'network-only',
	});

	// Subscription for real-time progress updates
	useSubscription(NAME_INGESTION_PROGRESS_SUBSCRIPTION, {
		onData: () => {
			refetch();
		},
	});

	const [startIngestion, { loading: isStarting }] = useMutation(START_INGESTION_MUTATION, {
		onCompleted: () => {
			refetch();
		},
	});

	const countries: CountryStatus[] = data?.ingestionStatus || [];
	const isAnyIngesting = countries.some((c) => c.isIngesting);

	return {
		countries,
		loading,
		error,
		isAnyIngesting,
		isStarting,
		startIngestion,
		refetch,
	};
}
