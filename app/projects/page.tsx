"use client"

import Link from "next/link"
import { Filter, Plus, Search, Edit, Trash } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useProjects } from "@/hooks/use-data"
import { projectApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface Project {
  id: string;
  title: string;
  statusId: string;
  status: {
    id: string;
    name: string;
    color: string;
    description?: string | null;
    isDefault: boolean;
  };
  startDate?: string | null;
  endDate?: string | null;
}

export default function ProjectsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { projects, isLoading, isError, mutate } = useProjects(page, 20, {})
  const { toast } = useToast()

  // Show error toast when there's an API error
  useEffect(() => {
    if (isError) {
      console.error('Projects page error:', isError);
      toast({
        title: "Error loading projects",
        description: isError instanceof Error ? isError.message : "Failed to load projects",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const deleteProject = async (id: string) => {
    try {
      await projectApi.deleteProject(id)
      mutate() // Refresh the data
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the project",
        variant: "destructive",
      })
    }
  }

  const refreshProjects = async () => {
    try {
      await mutate();
      toast({
        title: "Projects refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh projects",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <div className="flex items-center gap-2">
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
          <Button variant="secondary" onClick={refreshProjects}>
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-8" />
        </div>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center p-4">Loading projects...</div>
      ) : isError ? (
        <div className="text-center p-4 text-red-500">
          <p className="font-semibold">Error loading projects</p>
          <p className="text-sm mt-2">{isError instanceof Error ? isError.message : "An unexpected error occurred"}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => mutate()}
          >
            Try Again
          </Button>
        </div>
      ) : projects && projects.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project: Project) => (
              <TableRow key={project.id}>
                <TableCell>{project.title}</TableCell>
                <TableCell>
                  <Badge
                    style={{ backgroundColor: project.status?.color || '#6E56CF' }}
                    className="text-white"
                  >
                    {project.status?.name || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</TableCell>
                <TableCell>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => deleteProject(project.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center p-4">No projects found</div>
      )}
    </DashboardLayout>
  )
}

