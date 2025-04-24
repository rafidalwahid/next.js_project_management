"use client"

import useSWR from 'swr';
import { projectApi, taskApi, teamApi, eventApi } from '@/lib/api';

/**
 * Hook to fetch projects
 */
export function useProjects(page = 1, limit = 10, filters: Record<string, string> = {}) {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) =>
      value !== null &&
      value !== undefined &&
      typeof value === 'string' &&
      value !== '[object Object]'
    )
  );

  const queryString = `/api/projects?page=${page}&limit=${limit}${
    Object.keys(cleanFilters).length > 0
      ? `&${new URLSearchParams(cleanFilters).toString()}`
      : ''
  }`;

  const { data, error, isLoading, mutate } = useSWR(
    queryString,
    async () => {
      try {
        const response = await projectApi.getProjects(page, limit, filters);
        return response;
      } catch (err) {
        console.error('Project fetch error:', err);
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 5000,
    }
  );

  return {
    projects: data?.projects || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single project
 */
export function useProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/projects/${id}` : null,
    async () => {
      if (!id) return null;
      console.log('Fetching project with ID:', id);
      try {
        const response = await projectApi.getProject(id);
        console.log('Project fetch response:', response);
        return response;
      } catch (err) {
        console.error('Error in useProject hook:', err);
        throw err;
      }
    }
  );

  return {
    project: data?.project,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch tasks
 */
export function useTasks(page = 1, limit = 10, filters = {}) {
  // Clean filters to avoid [object Object] and other invalid values
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '[object Object]' &&
      String(value).trim() !== ''
    )
  );

  const queryString = `/api/tasks?page=${page}&limit=${limit}${
    Object.keys(cleanFilters).length > 0
      ? `&${new URLSearchParams(cleanFilters as Record<string, string>).toString()}`
      : ''
  }`;

  const { data, error, isLoading, mutate } = useSWR(
    queryString,
    async () => {
      console.log('Fetching tasks with query:', queryString);
      const response = await taskApi.getTasks(page, limit, cleanFilters);
      return response;
    }
  );

  return {
    tasks: data?.tasks || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single task
 */
export function useTask(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/tasks/${id}` : null,
    async () => {
      if (!id) return null;
      const response = await taskApi.getTask(id);
      return response;
    }
  );

  return {
    task: data?.task,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch team members
 */
export function useTeamMembers(projectId?: string, page = 1, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/team?${projectId ? `projectId=${projectId}&` : ''}page=${page}&limit=${limit}`,
    async () => {
      const response = await teamApi.getTeamMembers(projectId, page, limit);
      return response;
    }
  );

  return {
    teamMembers: data?.teamMembers || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch events
 */
export function useEvents(projectId?: string, page = 1, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/events?${projectId ? `projectId=${projectId}&` : ''}page=${page}&limit=${limit}`,
    async () => {
      const response = await eventApi.getEvents(projectId, page, limit);
      return response;
    }
  );

  return {
    events: data?.events || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}


