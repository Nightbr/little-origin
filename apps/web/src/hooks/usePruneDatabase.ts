import { PRUNE_EXTENDED_NAMES_MUTATION } from '@/graphql/operations';
import { useMutation } from '@apollo/client';

export function usePruneDatabase() {
	const [pruneExtendedNames, { loading }] = useMutation(PRUNE_EXTENDED_NAMES_MUTATION);

	const prune = async () => {
		const result = await pruneExtendedNames();
		return result.data?.pruneExtendedNames ?? 0;
	};

	return {
		prune,
		loading,
	};
}
