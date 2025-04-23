import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR('/api/dashboard/stats', fetchAPI, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60000, // 1 minute
    // Provide fallback data to avoid loading state
    fallbackData: {
      stats: {
        totalProjects: 0,
        projectGrowth: 0,
        recentProjects: []
      }
    }
  });

  return {
    stats: data?.stats,
    isLoading,
    isError: error
  };
}