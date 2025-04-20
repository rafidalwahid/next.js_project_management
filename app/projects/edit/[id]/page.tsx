"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Save, X, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { DashboardNav } from "@/components/dashboard-nav"
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
  const { statuses } = useProjectStatuses()
  const { toast } = useToast()

  // Fetch tasks for this project
  const { tasks, isLoading: tasksLoading, mutate: mutateTasks } = useTasks(1, 100, { projectId })
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    statusId: "",
  })

  useEffect(() => {
    if (project) {
      setProjectData({
        title: project.title,
        description: project.description || "",
        startDate: project.startDate,
        endDate: project.endDate,
        statusId: project.statusId,
      })
    }
  }, [project])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name: string) => (date: Date | undefined) => {
    if (date) {
      setProjectData((prev) => ({ ...prev, [name]: date.toISOString() }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await projectApi.updateProject(projectId, projectData)
      mutate() // Refresh the data
      toast({
        title: "Project updated",
        description: "Project has been updated successfully",
      })
      router.push("/projects")
    } catch (error) {
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

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header y navegación... */}
      <div className="grid flex-1 md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r bg-muted/40 md:block">
          <DashboardNav />
        </aside>
        <main className="flex flex-col gap-6 p-6">
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
                      defaultDate={new Date(projectData.startDate)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <DatePicker onSelect={handleDateChange("endDate")} defaultDate={new Date(projectData.endDate)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="statusId">Status</Label>
                  <Select onValueChange={handleSelectChange("statusId")} defaultValue={projectData.statusId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        </main>
      </div>
    </div>
  )
}
