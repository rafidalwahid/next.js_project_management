"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Save, X, Plus } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreateStatusModal } from "@/components/projects/create-status-modal"
import { useProject, useTasks } from "@/hooks/use-data"
import { projectApi, taskApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useProjectStatuses } from "@/hooks/use-project-statuses"
import { TaskList } from "@/components/tasks/task-list"

export default function EditProjectPage() {
  // Use the useParams hook to get the params
  const params = useParams()
  const projectId = params.id as string

  const router = useRouter()
  const { project, isLoading, mutate } = useProject(projectId)
  const { statuses, mutate: mutateStatuses } = useProjectStatuses()
  const [createStatusModalOpen, setCreateStatusModalOpen] = useState(false)
  const { toast } = useToast()

  // Fetch tasks for this project
  const { tasks, isLoading: tasksLoading, mutate: mutateTasks } = useTasks(1, 100, { projectId })
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    statusId: "",
    statusIds: [] as string[], // Multiple statuses
  })

  useEffect(() => {
    console.log('Project data received:', project);
    if (project) {
      // Extract additional status IDs from project.statuses
      const additionalStatusIds = project.statuses
        ?.filter((link: any) => !link.isPrimary)
        .map((link: any) => link.statusId) || [];

      // Format dates properly
      const formattedData = {
        title: project.title,
        description: project.description || "",
        startDate: project.startDate,
        endDate: project.endDate,
        statusId: project.statusId,
        statusIds: additionalStatusIds,
      };

      console.log('Setting project data from:', formattedData);
      console.log('Date values:', {
        startDate: project.startDate,
        endDate: project.endDate,
        startDateFormatted: project.startDate ? new Date(project.startDate).toISOString() : null,
        endDateFormatted: project.endDate ? new Date(project.endDate).toISOString() : null
      });

      setProjectData(formattedData);
    }
  }, [project])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    if (name === 'statusId' && value === 'create-new') {
      setCreateStatusModalOpen(true)
      return
    }
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusCreated = useCallback((newStatus: any) => {
    console.log("New status created:", newStatus)
    // Update the statuses list
    mutateStatuses()
    // Set the new status as the selected one
    if (newStatus && newStatus.id) {
      console.log("Setting status ID to:", newStatus.id)
      setProjectData(prev => ({ ...prev, statusId: newStatus.id }))
    }
  }, [mutateStatuses])

  const handleDateChange = (name: string) => (date: Date | undefined) => {
    console.log(`Date change for ${name}:`, date);
    if (date) {
      setProjectData((prev) => ({ ...prev, [name]: date.toISOString() }))
    } else {
      // If date is cleared, set to null
      setProjectData((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting project update with data:', projectData)

    try {
      // Format dates properly
      const formattedData = {
        ...projectData,
        startDate: projectData.startDate || null,
        endDate: projectData.endDate || null
      }

      console.log('Formatted data for API:', formattedData)
      const result = await projectApi.updateProject(projectId, formattedData)
      console.log('Project update result:', result)

      mutate() // Refresh the data
      toast({
        title: "Project updated",
        description: "Project has been updated successfully",
      })
      router.push("/projects")
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      })
    }
  }

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId)
      mutateTasks() // Refresh the tasks data
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading project details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show error state
  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Error</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Project Not Found</CardTitle>
              <CardDescription>The project you're looking for could not be found.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Please check the project ID and try again.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/projects">Go back to projects</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
            <div className="flex items-center gap-2">
              <Link href="/projects">
                <Button variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Edit the project details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Project Name</Label>
                  <Input
                    id="title"
                    name="title"
                    value={projectData.title}
                    onChange={handleInputChange}
                    placeholder="Enter the project name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={projectData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the project and its objectives"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <DatePicker
                      onSelect={handleDateChange("startDate")}
                      defaultDate={projectData.startDate ? new Date(projectData.startDate) : undefined}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <DatePicker
                      onSelect={handleDateChange("endDate")}
                      defaultDate={projectData.endDate ? new Date(projectData.endDate) : undefined}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="statusId">Primary Status</Label>
                    <Select onValueChange={handleSelectChange("statusId")} value={projectData.statusId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color || '#888888' }}
                              />
                              {status.name}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="create-new" className="text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-3.5 w-3.5" />
                            Create New Status
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="statusIds">Additional Statuses (Optional)</Label>
                    <MultiSelect
                      options={statuses
                        .filter(status => status.id !== projectData.statusId)
                        .map(status => ({
                          value: status.id,
                          label: status.name,
                          color: status.color
                        }))}
                      selected={projectData.statusIds}
                      onChange={(selectedValues) => {
                        setProjectData(prev => ({ ...prev, statusIds: selectedValues }))
                      }}
                      placeholder="Select additional statuses"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      A project can have multiple statuses. Select one or more additional statuses.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Project Tasks Section */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Tasks</CardTitle>
                <CardDescription>Manage tasks for this project</CardDescription>
              </div>
              <Link href={`/tasks/new?projectId=${projectId}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center p-4">Loading tasks...</div>
              ) : tasks && tasks.length > 0 ? (
                <TaskList tasks={tasks} onDelete={handleDeleteTask} />
              ) : (
                <div className="text-center p-8 border rounded-md bg-muted/10">
                  <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                  <p className="text-muted-foreground mb-4">This project doesn't have any tasks yet.</p>
                  <Link href={`/tasks/new?projectId=${projectId}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Task
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Create Status Modal */}
      <CreateStatusModal
        open={createStatusModalOpen}
        onOpenChange={setCreateStatusModalOpen}
        onStatusCreated={handleStatusCreated}
      />
    </DashboardLayout>
  )
}
