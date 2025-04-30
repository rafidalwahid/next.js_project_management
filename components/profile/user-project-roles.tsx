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
}

export function UserProjectRoles({ userId }: UserProjectRolesProps) {
  const [projects, setProjects] = useState<ProjectMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;
      
      setIsLoading(true)
      setError(null)
      
      // Use the shared utility for consistent error handling
      const { data, error } = await fetchProfileData<any>(
        `/api/users/${userId}/teams`
      );

      if (error) {
        setError(error);
        setProjects([]);
        setIsLoading(false);
        return;
      }

      try {
        // Handle different possible response formats
        if (!data) {
          setProjects([]);
        } else if (Array.isArray(data)) {
          // Direct array response
          setProjects(data);
        } else if (Array.isArray(data.teamMemberships)) {
          // Response with teamMemberships property
          setProjects(data.teamMemberships);
        } else if (Array.isArray(data.teams)) {
          // Response with teams property
          setProjects(data.teams);
        } else if (data && typeof data === 'object') {
          // Try to extract array from response object
          const memberships = Object.values(data).find(val => Array.isArray(val));
          if (memberships) {
            setProjects(memberships as ProjectMembership[]);
          } else {
            console.warn("Unexpected response format:", data);
            setProjects([]);
          }
        } else {
          console.warn("Unexpected response format:", data);
          setProjects([]);
        }
      } catch (err) {
        console.error("Error processing project data:", err);
        setError("Failed to process project memberships data");
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

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
