"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  MessageSquare,
  Trash,
  Save,
  X
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DraggableSubtaskList } from "@/components/tasks/draggable-subtask-list"
import { useToast } from "@/hooks/use-toast"
import { taskApi } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { MultiSelect } from "@/components/ui/multi-select"
import { useProjects } from "@/hooks/use-data"
import { useUsers } from "@/hooks/use-users"

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { projects } = useProjects(1, 100)
  const { users } = useUsers("", 100) // Empty search string, limit of 100 users

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    projectId: "",
    assignedToId: null as string | null,
    assigneeIds: [] as string[],
    parentId: null as string | null,
  })

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await taskApi.getTask(taskId)
      console.log('Fetched task:', JSON.stringify({
        id: response.task.id,
        title: response.task.title,
        dueDate: response.task.dueDate
      }, null, 2));

      setTask(response.task)

      // Initialize form data
      const formDataToSet = {
        title: response.task.title,
        description: response.task.description || "",
        priority: response.task.priority,
        dueDate: response.task.dueDate || null, // Use null instead of empty string
        projectId: response.task.projectId,
        assignedToId: response.task.assignedToId || null,
        assigneeIds: response.task.assignees && Array.isArray(response.task.assignees) ? response.task.assignees.map((a: any) => a.userId) : [],
        parentId: response.task.parentId,
      };

      setFormData(formDataToSet);
      console.log('Form data initialized with:', JSON.stringify(formDataToSet, null, 2));

      console.log('Form data initialized with dueDate:', formData.dueDate);

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

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await taskApi.deleteTask(taskId)
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      })
      router.push("/tasks")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMultiSelectChange = (name: string) => (values: string[]) => {
    setFormData((prev) => ({ ...prev, [name]: values }))
  }

  const handleDateChange = (date: Date | undefined) => {
    console.log('Date selected:', date);
    // If date is undefined or null, set dueDate to null instead of empty string
    // This ensures the API correctly sets it to null in the database
    const isoDate = date ? date.toISOString() : null;
    console.log('Converted to ISO:', isoDate);

    setFormData((prev) => ({
      ...prev,
      dueDate: isoDate
    }));

    console.log('Updated formData.dueDate:', isoDate);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)

      console.log('Submitting task update with data:', formData);

      await taskApi.updateTask(taskId, formData)

      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      })

      // Refresh task data and exit edit mode
      await fetchTask()
      setIsEditing(false)
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

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return "U"

    const nameParts = name.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    return name.substring(0, 2).toUpperCase()
  }

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "destructive"
      case "medium":
        return "warning"
      case "low":
        return "outline"
      default:
        return "outline"
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

          {task.parent && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/tasks/${task.parent.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Parent Task
              </Link>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button variant="destructive" size="sm" onClick={handleDeleteTask}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        {isEditing ? (
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
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                  {task.project && (
                    <CardDescription>
                      <Link href={`/projects/${task.project.id}`} className="hover:underline">
                        {task.project.title}
                      </Link>
                    </CardDescription>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize">
                    {task.priority} priority
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Task description */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {task.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task details */}
                <div className="space-y-4">
                  {/* Debug info - will be removed after fixing */}
                  <div className="text-xs text-muted-foreground mb-2 hidden">
                    Raw dueDate: {JSON.stringify(task.dueDate)}
                  </div>

                  {task.dueDate ? (
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground mr-2">Due:</span>
                        <span>
                          {format(new Date(task.dueDate), "PPP")}
                          {" "}
                          <span className="text-muted-foreground">
                            ({formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })})
                          </span>
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground mr-2">Created:</span>
                      <span>
                        {format(new Date(task.createdAt), "PPP")}
                        {" "}
                        <span className="text-muted-foreground">
                          ({formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })})
                        </span>
                      </span>
                    </div>
                  </div>

                  {task.updatedAt && task.updatedAt !== task.createdAt && (
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground mr-2">Updated:</span>
                        <span>
                          {format(new Date(task.updatedAt), "PPP")}
                          {" "}
                          <span className="text-muted-foreground">
                            ({formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })})
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assigned users */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Assigned to</h3>
                  {task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0 ? (
                    <div className="space-y-3">
                      {task.assignees.map((assignee: any) => (
                        <div key={assignee.id} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-black/10">
                            {assignee.user.image ? (
                              <AvatarImage src={assignee.user.image} alt={assignee.user.name || "User"} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getUserInitials(assignee.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{assignee.user.name || "Unnamed User"}</p>
                            <p className="text-sm text-muted-foreground">{assignee.user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : task.assignedTo ? (
                    // Fallback to legacy assignedTo field
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-black/10">
                        {task.assignedTo.image ? (
                          <AvatarImage src={task.assignedTo.image} alt={task.assignedTo.name || "User"} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getUserInitials(task.assignedTo.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{task.assignedTo.name || "Unnamed User"}</p>
                        <p className="text-sm text-muted-foreground">{task.assignedTo.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not assigned</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Subtasks section with drag and drop */}
              <DraggableSubtaskList
                parentTaskId={task.id}
                projectId={task.projectId}
                subtasks={task.subtasks || []}
                onSubtaskChange={fetchTask}
              />

              {task.activities && task.activities.length > 0 && (
                <>
                  <Separator />

                  {/* Activity log */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Recent Activity
                    </h3>
                    <ul className="space-y-3">
                      {task.activities.map((activity: any) => (
                        <li key={activity.id} className="text-sm flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">{activity.user?.name || "User"}</span>
                            {" "}
                            <span className="text-muted-foreground">{activity.description}</span>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
        </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
