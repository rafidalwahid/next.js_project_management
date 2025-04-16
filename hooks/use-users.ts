import useSWR from 'swr';
import { userApi } from '@/lib/api';

type User = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role: string;
};

type UsersResponse = {
  users: User[];
};

/**
 * Hook to fetch users from the API
 */
export function useUsers(search?: string, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/users?search=${search || ''}&limit=${limit}`,
    async () => {
      const response = await userApi.getUsers(search, limit);
      return response as UsersResponse;
    }
  );

  return {
    users: data?.users || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch users for a specific project
 */
export function useProjectUsers(projectId: string, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    projectId ? `/api/users?projectId=${projectId}&limit=${limit}` : null,
    async () => {
      const response = await userApi.getUsersInProject(projectId, limit);
      return response as UsersResponse;
    }
  );

  return {
    users: data?.users || [],
    isLoading,
    isError: error,
    mutate,
  };
} 