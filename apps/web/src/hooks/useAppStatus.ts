import { useQuery } from '@apollo/client';
import { APP_STATUS_QUERY } from '../graphql/operations';

interface AppStatus {
  hasUsers: boolean;
  userCount: number;
  isOnboardingComplete: boolean;
}

interface AppStatusResult {
  appStatus: AppStatus | null;
  loading: boolean;
  error: Error | undefined;
  needsOnboarding: boolean;
  isOnboardingComplete: boolean;
  refetch: () => void;
}

export function useAppStatus(): AppStatusResult {
  const { data, loading, error, refetch } = useQuery(APP_STATUS_QUERY, {
    fetchPolicy: 'cache-and-network', // Use cache but also fetch fresh
  });

  const appStatus = data?.appStatus ?? null;
  const needsOnboarding = !loading && appStatus !== null && !appStatus.isOnboardingComplete;
  const isOnboardingComplete = !loading && appStatus !== null && appStatus.isOnboardingComplete;

  return {
    appStatus,
    loading,
    error,
    needsOnboarding,
    isOnboardingComplete,
    refetch,
  };
}
