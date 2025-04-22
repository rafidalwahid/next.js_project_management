"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { Separator } from "@/components/ui/separator"
import { SubtaskList } from "@/components/tasks/subtask-list"
import { MultiSelect } from "@/components/ui/multi-select"
import { useToast } from "@/hooks/use-toast"
import { useProjects } from "@/hooks/use-data"
import { useUsers } from "@/hooks/use-users"
import { taskApi } from "@/lib/api"

export default function EditTaskPage() {
  const params = useParams()
  const taskId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const { projects } = useProjects(1, 100)
  const { users } = useUsers(100)

  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    projectId: "",
    assignedToId: null, // Keep for backward compatibility but use null instead of empty string
    assigneeIds: [] as string[], // New field for multiple assignees
    parentId: null as string | null,
  })

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await taskApi.getTask(taskId)
      setTask(response.task)

      // Initialize form data
      setFormData({
        title: response.task.title,
        description: response.task.description || "",
        priority: response.task.priority,
        dueDate: response.task.dueDate || "",
        projectId: response.task.projectId,
        assignedToId: response.task.assignedToId || null,
        assigneeIds: response.task.assignees && Array.isArray(response.task.assignees) ? response.task.assignees.map((a: any) => a.userId) : [],
        parentId: response.task.parentId,
      })

      setError(null)
    } catch (err) {
      setError("Failed to load task details")
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    // Special handling for parentId
    if (name === "parentId" && value === "null") {
      setFormData((prev) => ({ ...prev, [name]: null }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleMultiSelectChange = (name: string) => (values: string[]) => {
    setFormData((prev) => ({ ...prev, [name]: values }))
  }

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      dueDate: date ? date.toISOString() : ""
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      console.log('Submitting task update with data:', formData);

      // Create a copy of the form data and ensure parentId is properly formatted
      const dataToSubmit = {
        ...formData,
        // Convert "null" string to actual null
        parentId: formData.parentId === "null" ? null : formData.parentId
      };

      await taskApi.updateTask(taskId, dataToSubmit)

      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      })

      router.push(`/tasks/${taskId}`)
    } catch (error) {
      console.error('Error updating task:', error);
      let errorMessage = "Failed to update task";

      // Try to extract more detailed error message
      if (error instanceof Error) {
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        } catch (e) {
          // If parsing fails, use the original error message
          errorMessage = error.message || errorMessage;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex min-h-screen flex-col p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load task details</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error || "Task not found"}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/tasks">Go back to tasks</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/tasks/${taskId}`}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Edit Task</CardTitle>
            <CardDescription>Update task details</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter task description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={handleSelectChange("priority")}
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

                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <DatePicker
                    onSelect={handleDateChange}
                    defaultDate={formData.dueDate ? new Date(formData.dueDate) : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assigneeIds">Assigned To (Multiple)</Label>
                  <MultiSelect
                    options={users.map((user) => ({
                      label: user.name || user.email,
                      value: user.id,
                    }))}
                    selected={formData.assigneeIds}
                    onChange={handleMultiSelectChange("assigneeIds")}
                    placeholder="Select team members..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can assign multiple users to this task
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={handleSelectChange("projectId")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {task.parent || task.subtasks?.length > 0 ? (
                  <div className="grid gap-2">
                    <Label htmlFor="parentId">Parent Task</Label>
                    <Select
                      value={formData.parentId || "null"}
                      onValueChange={handleSelectChange("parentId")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent task" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">No Parent (Top-level Task)</SelectItem>
                        {task.parent && (
                          <SelectItem value={task.parent.id}>
                            {task.parent.title}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {task.subtasks?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: This task has subtasks. Changing the parent may affect the subtask hierarchy.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {task.subtasks && task.subtasks.length > 0 && (
              <>
                <Separator />
                <SubtaskList
                  parentTaskId={task.id}
                  projectId={task.projectId}
                  subtasks={task.subtasks}
                  onSubtaskChange={fetchTask}
                />
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href={`/tasks/${taskId}`}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>

            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
