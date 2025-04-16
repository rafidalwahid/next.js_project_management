"use client"

import Link from "next/link"
import { Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface Project {
  id: string
  title: string
  status: string
  startDate: string | null
  endDate: string | null
  role: string
  joinedAt: string
}

interface UserProfileProjectsProps {
  projects: Project[]
}

export function UserProfileProjects({ projects }: UserProfileProjectsProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Projects the user is involved in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <h3 className="text-lg font-medium">No Projects</h3>
              <p className="text-sm text-muted-foreground">
                This user is not currently assigned to any projects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Projects</h2>
        <Link href="/projects" className="text-sm text-primary hover:underline">
          View All Projects
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group"
          >
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      project.status === "completed"
                        ? "success"
                        : project.status === "active"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {project.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {project.role}
                  </Badge>
                </div>
                <CardTitle className="group-hover:text-primary">
                  {project.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {project.startDate ? formatDate(project.startDate) : "Not started"}
                        {" - "}
                        {project.endDate ? formatDate(project.endDate) : "Ongoing"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Joined {formatDate(project.joinedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
