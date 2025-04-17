"use client"

import useSWR from 'swr';
import { projectApi, taskApi, teamApi, eventApi, resourceApi } from '@/lib/api';

/**
 * Hook to fetch projects
 */
export function useProjects(page = 1, limit = 10, filters: Record<string, string> = {}) {
  // Filter out any invalid values from filters
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => 
      value !== null && 
      value !== undefined && 
      typeof value === 'string' && 
      value !== '[object Object]'
    )
  );
  
  // Create a unique cache key that includes all parameters
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
        throw err;
      }
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
      const response = await projectApi.getProject(id);
      return response;
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
  const { data, error, isLoading, mutate } = useSWR(
    `/api/tasks?page=${page}&limit=${limit}&${new URLSearchParams(filters as Record<string, string>).toString()}`,
    async () => {
      const response = await taskApi.getTasks(page, limit, filters);
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

/**
 * Hook to fetch resources
 */
export function useResources(page = 1, limit = 10, filters = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/resources?page=${page}&limit=${limit}&${new URLSearchParams(filters as Record<string, string>).toString()}`,
    async () => {
      const response = await resourceApi.getResources(page, limit, filters);
      return response;
    }
  );

  return {
    resources: data?.resources || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}
