"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { DashboardNav } from "@/components/dashboard-nav"
import { MultiSelect } from "@/components/ui/multi-select"
import { useProjects } from "@/hooks/use-data"
import { taskApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useUsers } from "@/hooks/use-users"

export default function NewTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { projects } = useProjects(1, 100)
  const { users } = useUsers()
  const { toast } = useToast()
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedToId: "", // Keep for backward compatibility
    assigneeIds: [] as string[], // New field for multiple assignees
    dueDate: "",
    status: "pending", // Default status
    priority: "medium", // Default priority
    parentId: null as string | null, // For subtasks
  })

  const [parentTask, setParentTask] = useState<any>(null)
  const [loadingParent, setLoadingParent] = useState(false)

  // Check for projectId and parentId in URL parameters
  useEffect(() => {
    const projectId = searchParams.get('projectId')
    const parentId = searchParams.get('parentId')

    if (projectId) {
      setTaskData(prev => ({ ...prev, projectId }))
    }

    // If parentId is provided, fetch the parent task
    if (parentId) {
      const fetchParentTask = async () => {
        try {
          setLoadingParent(true)
          const response = await taskApi.getTask(parentId)
          setParentTask(response.task)

          // Set project ID to match parent task's project
          if (response.task.projectId) {
            setTaskData(prev => ({
              ...prev,
              projectId: response.task.projectId,
              parentId: parentId
            }))
          }
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to load parent task details",
            variant: "destructive",
          })
        } finally {
          setLoadingParent(false)
        }
      }

      fetchParentTask()
    }
  }, [searchParams, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTaskData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setTaskData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMultiSelectChange = (name: string) => (values: string[]) => {
    setTaskData((prev) => ({ ...prev, [name]: values }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setTaskData((prev) => ({ ...prev, dueDate: date.toISOString() }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await taskApi.createTask(taskData)
      toast({
        title: "Task created",
        description: "New task has been created successfully",
      })

      // Determine where to redirect after task creation
      const parentId = searchParams.get('parentId')
      const projectId = searchParams.get('projectId')

      if (parentId) {
        // If this is a subtask, go back to parent task
        router.push(`/tasks/${parentId}`)
      } else if (projectId) {
        // If task was created from a project page, redirect back to that project
        router.push(`/projects/edit/${projectId}`)
      } else {
        // Otherwise go to the task list
        router.push("/tasks")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
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
            <h1 className="text-3xl font-bold tracking-tight">New Task</h1>
            <div className="flex items-center gap-2">
              <Link href="/tasks">
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
                <CardTitle>{parentTask ? "Create Subtask" : "New Task"}</CardTitle>
                <CardDescription>
                  {parentTask
                    ? `Add a subtask to "${parentTask.title}"`
                    : "Enter the details of the new task"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={taskData.title}
                    onChange={handleInputChange}
                    placeholder="Enter the task title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={taskData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the task"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select
                    onValueChange={handleSelectChange("projectId")}
                    value={taskData.projectId}
                    disabled={!!parentTask} // Disable if this is a subtask
                  >
                    <SelectTrigger>
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
                  {parentTask && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Subtasks must belong to the same project as their parent task.
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assigneeIds">Assigned to (Multiple)</Label>
                  <MultiSelect
                    options={users.map((user) => ({
                      label: user.name || user.email,
                      value: user.id,
                    }))}
                    selected={taskData.assigneeIds}
                    onChange={handleMultiSelectChange("assigneeIds")}
                    placeholder="Select team members..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can assign multiple users to this task
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <DatePicker onSelect={handleDateChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      onValueChange={handleSelectChange("status")}
                      value={taskData.status}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      onValueChange={handleSelectChange("priority")}
                      value={taskData.priority}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Display parent task info if this is a subtask */}
                {parentTask && (
                  <div className="bg-muted/30 p-4 rounded-md border">
                    <h3 className="text-sm font-medium mb-2">Parent Task</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        parentTask.status === "completed"
                          ? "success"
                          : parentTask.status === "in-progress"
                            ? "default"
                            : "secondary"
                      }>
                        {parentTask.status}
                      </Badge>
                      <span className="font-medium">{parentTask.title}</span>
                    </div>
                    {parentTask.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {parentTask.description}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {parentTask ? "Create Subtask" : "Save Task"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </div>
  )
}
