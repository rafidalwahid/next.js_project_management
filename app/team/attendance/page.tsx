"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjects } from "@/hooks/use-data"
import { TeamAttendance } from "@/components/team/team-attendance"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"

export default function TeamAttendancePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const projectIdParam = searchParams.get("projectId")
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdParam || "")

  const { projects, isLoading: isLoadingProjects } = useProjects(1, 100)

  // Check if user has permission to view team attendance
  useEffect(() => {
    if (!session) return

    const userRole = session.user.role
    if (userRole !== "admin" && userRole !== "manager") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view team attendance",
        variant: "destructive"
      })
      router.push("/dashboard")
    }
  }, [session, router, toast])

  // Update URL when project selection changes
  useEffect(() => {
    if (selectedProjectId) {
      router.push(`/team/attendance?projectId=${selectedProjectId}`)
    }
  }, [selectedProjectId, router])

  // Set first project as default if none selected
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0 && !projectIdParam) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId, projectIdParam])

  if (!session) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Attendance</h1>
          <p className="text-muted-foreground">
            Monitor attendance records for your team members
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Project Selection</CardTitle>
          <CardDescription>
            Select a project to view team attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <div className="flex items-center justify-center h-10">
              <Spinner />
            </div>
          ) : (
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedProjectId ? (
        <TeamAttendance projectId={selectedProjectId} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              {projects.length > 0
                ? "Please select a project to view team attendance"
                : "No projects available. Create a project first to track team attendance."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
