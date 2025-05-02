"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchProfileData } from "@/lib/utils/profile-utils"

interface ProjectMembership {
  id: string
  projectId: string
  projectTitle: string
}

interface UserProjectRolesProps {
  userId: string
  teamMemberships?: ProjectMembership[]
}

export function UserProjectRoles({ userId, teamMemberships }: UserProjectRolesProps) {
  const [projects, setProjects] = useState<ProjectMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If teamMemberships are provided as a prop, use them directly
    if (teamMemberships && teamMemberships.length > 0) {
      setProjects(teamMemberships);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch them from the API
    const fetchProjects = async () => {
      if (!userId) return;

      setIsLoading(true)
      setError(null)

      try {
        // Directly fetch team memberships from the database
        const response = await fetch(`/api/team/user/${userId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch team memberships: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Team memberships data:', data);

        // Format the data for display
        if (data && Array.isArray(data.teamMemberships)) {
          const formattedMemberships = data.teamMemberships.map(membership => ({
            id: membership.id,
            projectId: membership.project.id,
            projectTitle: membership.project.title
          }));
          setProjects(formattedMemberships);
        } else {
          console.warn("Unexpected response format:", data);
          setProjects([]);
        }
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError("Failed to fetch project memberships");
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [userId, teamMemberships]);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <h3 className="text-sm font-medium mb-2">Project Memberships</h3>

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
              <div
                key={membership.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 last:border-0 gap-2"
              >
                <div className="font-medium truncate">
                  {membership.projectTitle || "Unnamed Project"}
                </div>
                <Badge variant="outline" className="w-fit">Member</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
