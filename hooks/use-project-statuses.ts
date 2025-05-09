import useSWR from 'swr';
import { fetchAPI, projectStatusApi } from '@/lib/api';
import { ProjectStatus } from '@/types/project';

export function useProjectStatuses() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/project-statuses',
    projectStatusApi.getProjectStatuses
  );

  return {
    statuses: data?.statuses as ProjectStatus[] || [],
    isLoading,
    isError: error,
    mutate,
  };
}
