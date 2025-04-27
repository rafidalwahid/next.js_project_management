"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { teamApi } from "@/lib/api"

interface UserProjectRolesProps {
  userId: string
}

export function UserProjectRoles({ userId }: UserProjectRolesProps) {
  const [projects, setProjects] = useState<Array<{
    id: string
    projectId: string
    projectTitle: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        // Fetch the user's team memberships
        const response = await teamApi.getUserTeamMemberships(userId)
        console.log("Team memberships response:", response)

        // Handle different response formats
        if (Array.isArray(response)) {
          // Direct array response
          setProjects(response)
        } else if (response && Array.isArray(response.teamMemberships)) {
          // Response with teamMemberships property
          setProjects(response.teamMemberships)
        } else if (response && typeof response === 'object') {
          // Try to extract data from response object
          const memberships = Object.values(response).find(val => Array.isArray(val))
          if (memberships) {
            setProjects(memberships)
          } else {
            console.error("Unexpected response format:", response)
            setProjects([])
          }
        } else {
          console.error("Unexpected response format:", response)
          setProjects([])
        }
      } catch (error) {
        console.error("Error fetching user projects:", error)
        setProjects([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Memberships</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            This user is not a member of any projects.
          </p>
        ) : (
          <div className="max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
            <div className="space-y-3">
              {projects.map((membership) => (
                <div key={membership.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 last:border-0 gap-2">
                  <div className="font-medium truncate">{membership.projectTitle}</div>
                  <Badge variant="outline" className="w-fit">Member</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
