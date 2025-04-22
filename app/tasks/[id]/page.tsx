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
  Trash
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

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await taskApi.getTask(taskId)
      setTask(response.task)
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
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tasks/edit/${task.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button variant="destructive" size="sm" onClick={handleDeleteTask}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
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
              {task.dueDate && (
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
              )}

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
      </Card>
    </div>
  )
}
