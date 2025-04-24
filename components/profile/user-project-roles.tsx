"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleBadge } from "@/components/ui/role-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { teamApi } from "@/lib/api"

interface UserProjectRolesProps {
  userId: string
}

export function UserProjectRoles({ userId }: UserProjectRolesProps) {
  const [projectRoles, setProjectRoles] = useState<Array<{
    id: string
    projectId: string
    projectTitle: string
    role: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProjectRoles = async () => {
      try {
        setIsLoading(true)
        // Fetch the user's team memberships
        const response = await teamApi.getUserTeamMemberships(userId)
        setProjectRoles(response)
      } catch (error) {
        console.error("Error fetching project roles:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectRoles()
  }, [userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Roles</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : projectRoles.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            This user is not a member of any projects.
          </p>
        ) : (
          <div className="space-y-3">
            {projectRoles.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div className="font-medium">{membership.projectTitle}</div>
                <RoleBadge role={membership.role} type="project" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
