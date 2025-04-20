import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

export interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useProjectStatuses() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/project-statuses',
    fetchAPI
  );

  return {
    statuses: data?.statuses as ProjectStatus[] || [],
    isLoading,
    isError: error,
    mutate,
  };
}
