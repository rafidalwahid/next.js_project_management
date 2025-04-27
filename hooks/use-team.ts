"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { teamApi } from "@/lib/api"

/**
 * Hook to fetch team members with pagination
 */
export function useTeamMembers(projectId?: string, page = 1, limit = 10, search?: string) {
  const queryParams = new URLSearchParams()

  if (projectId) {
    queryParams.append("projectId", projectId)
  }

  queryParams.append("page", page.toString())
  queryParams.append("limit", limit.toString())

  if (search) {
    queryParams.append("search", search)
  }

  const { data, error, mutate, isLoading } = useSWR(
    `/api/team?${queryParams.toString()}`,
    teamApi.fetcher
  )

  return {
    teamMembers: data?.teamMembers || [],
    pagination: data?.pagination || { page, limit, totalCount: 0, totalPages: 0 },
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook to fetch a single team member
 */
export function useTeamMember(id?: string) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/team/${id}` : null,
    teamApi.fetcher
  )

  return {
    teamMember: data,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook to fetch team members for a user
 */
export function useUserTeams(userId?: string, page = 1, limit = 10) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? `/api/users/${userId}/teams?page=${page}&limit=${limit}` : null,
    teamApi.fetcher
  )

  return {
    teams: data?.teamMemberships || [],
    pagination: data?.pagination || { page, limit, totalCount: 0, totalPages: 0 },
    isLoading,
    isError: error,
    mutate,
  }
}

// useTeamMemberRole hook removed as we no longer have project roles

/**
 * Hook to manage team member removal
 */
export function useTeamMemberRemoval() {
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const removeTeamMember = async (teamMemberId: string) => {
    setIsRemoving(true)
    setError(null)

    try {
      const result = await teamApi.removeTeamMember(teamMemberId)
      return result
    } catch (err: any) {
      setError(err.message || "Failed to remove team member")
      throw err
    } finally {
      setIsRemoving(false)
    }
  }

  return {
    removeTeamMember,
    isRemoving,
    error,
  }
}

/**
 * Hook to check if current user is a member of a project
 */
export function useIsProjectMember(projectId?: string) {
  const { data, error, isLoading } = useSWR(
    projectId ? `/api/projects/${projectId}/membership` : null,
    teamApi.fetcher
  )

  return {
    isMember: data?.isMember || false,
    isLoading,
    isError: error,
  }
}
