"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Trash,
  CheckCircle,
  Circle,
  MessageSquare,
  Paperclip,
  Users,
  Plus,
  Info,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText,
  FileText as FileTextIcon,
  Table as TableIcon,
  File as FileIcon,
  BarChart as BarChartIcon,
  Send,
  Download,
  Trash2,
  Briefcase,
  Upload,
  X,
  ChevronRight,
  ChevronDown,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskForm } from "@/components/project/task-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SubtaskList } from "@/components/tasks/subtask-list"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import React from "react"
import { Task, TaskAssignee, TaskWithRelations, TaskComment, TaskAttachment } from "@/types/task"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.taskId as string
  const [task, setTask] = useState<TaskWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState<any>({
    title: "",
    description: "",
    priority: "medium",
    projectId: "",
    parentId: null
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()
  const fetchInProgress = React.useRef(false)

  // Fetch task data
  const fetchTask = React.useCallback(async () => {
    if (fetchInProgress.current) return

    try {
      fetchInProgress.current = true
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${taskId}?includeSubtasks=true`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch task: ${response.status}`)
      }

      const data = await response.json()
      if (!data.task) {
        throw new Error("Task data not found in response")
      }

      setTask(data.task)
    } catch (error) {
      console.error("Error fetching task:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch task details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      fetchInProgress.current = false
    }
  }, [taskId, toast])

  useEffect(() => {
    if (taskId) {
      fetchTask()
    }

    return () => {
      fetchInProgress.current = false
    }
  }, [taskId, fetchTask])

  // Initialize newTask with project ID when task is loaded
  useEffect(() => {
    if (task) {
      setNewTask(prev => ({
        ...prev,
        projectId: task.projectId,
        parentId: task.id
      }))
    }
  }, [task])

  const handleEditTask = () => {
    setIsEditDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false)
    // Refresh task data
    fetchTask()
  }

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully",
      })

      // Navigate back to the tasks page
      router.push("/tasks")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleCompletion = async () => {
    if (!task) return

    try {
      // Optimistically update the UI
      setTask(prev => prev ? { ...prev, completed: !prev.completed } : null)

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }

      // Refresh task data
      fetchTask()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task completion status",
        variant: "destructive",
      })
      // Revert the optimistic update
      fetchTask()
    }
  }

  const handleTimeUpdate = (newTime: number) => {
    // Update the task's time spent in the UI
    setTask(prev => prev ? { ...prev, timeSpent: newTime } : null)
  }

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null
    return format(new Date(dateString), "MMM d, yyyy")
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive border-destructive"
      case "low":
        return "text-muted-foreground"
      default:
        return ""
    }
  }

  // Handle subtask changes
  const handleSubtaskChange = () => {
    fetchTask()
  }

  // Handle inline subtask creation
  const handleCreateSubtask = async () => {
    if (!task || newTask.title.trim().length < 3) return;

    try {
      setIsLoading(true);

      // Call API to create the subtask
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTask.title.trim(),
          projectId: task.projectId,
          parentId: task.id,
          priority: "medium",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subtask");
      }

      // Reset the form
      setNewTask({
        ...newTask,
        title: "",
      });

      // Refresh the task data to show the new subtask
      fetchTask();

      toast({
        title: "Subtask created",
        description: "The subtask has been created successfully",
      });
    } catch (error) {
      console.error("Error creating subtask:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subtask",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsAddingComment(true)

      // Call the API endpoint to add the comment
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add comment")
      }

      const data = await response.json()

      // Update the UI with the new comment
      setTask(prev => {
        if (!prev) return null
        return {
          ...prev,
          comments: [...(prev.comments || []), data.comment],
        }
      })

      setNewComment("")
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingComment(false)
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return

    try {
      setIsUploadingAttachment(true)

      // Call the API endpoint to upload the file
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload file")
      }

      const data = await response.json()

      // Update the UI with the new attachment
      setTask(prev => {
        if (!prev) return null
        return {
          ...prev,
          attachments: [...(prev.attachments || []), data.attachment],
        }
      })

      setSelectedFile(null)
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    } else if (fileType.startsWith('video/')) {
      return <VideoIcon className="h-4 w-4" />
    } else if (fileType.startsWith('audio/')) {
      return <MusicIcon className="h-4 w-4" />
    } else if (fileType === 'application/pdf') {
      return <FileTextIcon className="h-4 w-4" />
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <TableIcon className="h-4 w-4" />
    } else if (fileType.includes('document') || fileType.includes('word')) {
      return <FileIcon className="h-4 w-4" />
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <BarChartIcon className="h-4 w-4" />
    } else {
      return <FileIcon className="h-4 w-4" />
    }
  }

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      // Optimistically update the UI
      setTask(prev => {
        if (!prev) return null
        return {
          ...prev,
          comments: prev.comments?.filter(comment => comment.id !== commentId) || [],
        }
      })

      // Call the API endpoint to delete the comment
      const response = await fetch(`/api/tasks/${taskId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete comment")
      }

      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)

      // Revert the optimistic update
      fetchTask()

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting an attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      // Optimistically update the UI
      setTask(prev => {
        if (!prev) return null
        return {
          ...prev,
          attachments: prev.attachments?.filter(attachment => attachment.id !== attachmentId) || [],
        }
      })

      // Call the API endpoint to delete the attachment
      const response = await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete attachment")
      }

      toast({
        title: "Attachment deleted",
        description: "The attachment has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting attachment:", error)

      // Revert the optimistic update
      fetchTask()

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete attachment. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(space.14))] md:h-[50vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Task not found</h2>
        <p className="text-muted-foreground mt-2">The task you're looking for doesn't exist or you don't have access to it.</p>
        <Button asChild className="mt-4">
          <Link href="/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Streamlined breadcrumb navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
        <Button variant="ghost" size="sm" asChild className="p-0 h-8 w-8 flex-shrink-0">
          <Link href="/tasks">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Tasks</span>
          </Link>
        </Button>
        <Link href="/tasks" className="hover:text-foreground transition-colors flex-shrink-0">
          Tasks
        </Link>
        {task.project && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <Link
              href={`/projects/${task.project.id}`}
              className="hover:text-foreground transition-colors flex items-center gap-1 truncate"
            >
              <Briefcase className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{task.project.title}</span>
            </Link>
          </>
        )}
      </div>

      {/* Enhanced task header with better mobile responsiveness */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {/* Task header with completion toggle and actions */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Completion toggle */}
            <Button
              variant={task.completed ? "default" : "outline"}
              size="icon"
              onClick={handleToggleCompletion}
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0 transition-colors",
                task.completed ? "bg-green-500 hover:bg-green-600 text-white border-0" : "border-2"
              )}
              title={task.completed ? "Mark as incomplete" : "Mark as complete"}
            >
              {task.completed ? (
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Circle className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>

            {/* Status badge - always visible */}
            {task.status && (
              <div
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm flex items-center gap-1"
                style={{
                  backgroundColor: `${task.status.color}20`,
                  color: task.status.color
                }}
              >
                <div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                  style={{ backgroundColor: task.status.color }}
                />
                {task.status.name}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditTask}
              className="h-8 px-2 sm:px-3 text-xs sm:text-sm hidden sm:flex"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditTask} className="sm:hidden">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash className="mr-2 h-4 w-4" />}
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Task title and metadata */}
        <div className="p-3 sm:p-4">
          <h1 className={cn(
            "text-lg sm:text-xl md:text-2xl font-bold tracking-tight break-words",
            task.completed && "text-muted-foreground line-through"
          )}>
            {task.title}
          </h1>

          {/* Task metadata - reorganized for better mobile display */}
          <div className="mt-3 space-y-2">
            {/* First row: Priority and Due date */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={task.priority === "high" ? "destructive" : task.priority === "low" ? "outline" : "secondary"}
                className="capitalize text-xs sm:text-sm h-6 sm:h-7"
              >
                {task.priority} priority
              </Badge>

              {task.dueDate && (
                <span className={cn(
                  "text-xs sm:text-sm flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md",
                  new Date(task.dueDate) < new Date() ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                )}>
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {new Date(task.dueDate) < new Date()
                    ? <span>Due: {formatDate(task.dueDate)} (Overdue)</span>
                    : <span>Due: {formatDate(task.dueDate)}</span>
                  }
                </span>
              )}
            </div>

            {/* Second row: Assignees and Time tracking */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Assignees */}
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex -space-x-2 mr-1">
                    {task.assignees.slice(0, 3).map((assignee) => (
                      <Avatar key={assignee.id} className="h-5 w-5 border border-background">
                        {assignee.user.image ? (
                          <AvatarImage src={assignee.user.image} alt={assignee.user.name || "User"} />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                          {assignee.user.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {task.assignees.length > 3 && (
                      <Avatar className="h-5 w-5 border border-background">
                        <AvatarFallback className="text-[10px] bg-muted">
                          +{task.assignees.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.assignees.length} {task.assignees.length === 1 ? 'assignee' : 'assignees'}
                  </span>
                </div>
              )}

              {/* Time tracking summary */}
              {(task.timeSpent || task.estimatedTime) && (
                <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md text-xs sm:text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{task.timeSpent || 0}h spent</span>
                  {task.estimatedTime && task.estimatedTime > 0 && (
                    <span className="text-muted-foreground">
                      of {task.estimatedTime}h estimated
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 order-2 lg:order-1">
          {/* Enhanced description section */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Description</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleEditTask}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                {task.description ? "Edit" : "Add"}
              </Button>
            </div>
            <div className="p-3 sm:p-4">
              {task.description ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {task.description.split('\n').map((paragraph, index) => (
                    paragraph ? (
                      <p key={index} className="mb-2">{paragraph}</p>
                    ) : (
                      <br key={index} />
                    )
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No description provided</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Add" to provide details about this task
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Consolidated tabs with simplified design */}
          <Tabs defaultValue="subtasks" className="space-y-3 sm:space-y-4">
            <TabsList className="bg-muted/50 p-0.5 sm:p-1 h-auto w-full grid grid-cols-3">
              <TabsTrigger value="subtasks" className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-8 sm:h-9">
                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Subtasks</span>
                {task.subtasks && task.subtasks.length > 0 && (
                  <Badge variant="secondary" className="ml-0 xs:ml-1 h-3.5 sm:h-4 px-1 text-[8px] sm:text-[10px]">
                    {task.subtasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-8 sm:h-9">
                <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Comments</span>
                {task.comments && task.comments.length > 0 && (
                  <Badge variant="secondary" className="ml-0 xs:ml-1 h-3.5 sm:h-4 px-1 text-[8px] sm:text-[10px]">
                    {task.comments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-8 sm:h-9">
                <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Files</span>
                {task.attachments && task.attachments.length > 0 && (
                  <Badge variant="secondary" className="ml-0 xs:ml-1 h-3.5 sm:h-4 px-1 text-[8px] sm:text-[10px]">
                    {task.attachments.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subtasks">
              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                {/* Subtasks header with progress */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-primary/10 rounded-full p-1.5">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Subtasks</h3>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {task.subtasks.filter(s => s.completed).length} of {task.subtasks.length} completed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtasks list with inline creation */}
                <div className="p-3 sm:p-4">
                  {/* Inline subtask creation form */}
                  <div className="mb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Add a new subtask..."
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        className="h-10 pl-10 pr-4 border-dashed focus:border-solid"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTask.title.trim().length >= 3) {
                            handleCreateSubtask();
                          }
                        }}
                      />
                      <Plus className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    </div>
                    <Button
                      className="h-10 px-4 bg-black hover:bg-black/90 text-white flex-shrink-0"
                      onClick={handleCreateSubtask}
                      disabled={!task || newTask.title.trim().length < 3}
                    >
                      <span className="sm:hidden">Add</span>
                      <span className="hidden sm:inline">Add Subtask</span>
                    </Button>
                  </div>

                  {task.subtasks && task.subtasks.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <SubtaskList
                        parentTaskId={task.id}
                        projectId={task.projectId}
                        subtasks={task.subtasks}
                        onSubtaskChange={handleSubtaskChange}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg border border-dashed">
                      <div className="bg-muted/30 rounded-full p-3 mb-3">
                        <CheckCircle className="h-6 w-6 text-muted-foreground opacity-70" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No subtasks yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Break down this task into smaller steps by adding subtasks using the form above
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comments">
              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                {/* Comments header */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">Comments</h3>
                      {task.comments && task.comments.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {task.comments.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  {/* Enhanced comment input */}
                  <div className="flex flex-col xs:flex-row gap-2 mb-4">
                    <Avatar className="h-8 w-8 border border-black/10 flex-shrink-0 hidden xs:block">
                      <AvatarFallback className="text-xs">ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none text-sm"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || isAddingComment}
                          className="flex items-center gap-1.5 w-full xs:w-auto justify-center"
                          size="sm"
                        >
                          {isAddingComment ? <Spinner className="h-3.5 w-3.5 mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                          <span className="xs:hidden">Post</span>
                          <span className="hidden xs:inline">Post Comment</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Comments list with improved styling */}
                  {task.comments && task.comments.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                      {task.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2 group">
                          <Avatar className="h-7 w-7 border border-background flex-shrink-0">
                            {comment.user.image ? (
                              <AvatarImage src={comment.user.image} alt={comment.user.name || "User"} />
                            ) : null}
                            <AvatarFallback className="text-[10px]">
                              {comment.user.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted/40 rounded-md p-2.5 relative">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-xs truncate">
                                  {comment.user.name || comment.user.email}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                                </span>
                              </div>
                              <div className="text-xs mt-1.5 whitespace-pre-wrap break-words">
                                {comment.content}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                                onClick={() => handleDeleteComment(comment.id)}
                                title="Delete comment"
                              >
                                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Be the first to add a comment to this task
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attachments">
              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                {/* Attachments header */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">Files</h3>
                      {task.attachments && task.attachments.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {task.attachments.length}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 sm:px-3"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploadingAttachment}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                      <span className="hidden xs:inline">Upload File</span>
                      <span className="xs:hidden">Upload</span>
                    </Button>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploadingAttachment}
                    />
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  {/* Selected file preview with improved styling */}
                  {selectedFile && (
                    <div className="mb-4 bg-muted/40 rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded flex items-center justify-center flex-shrink-0",
                          selectedFile.type.startsWith('image/') ? "bg-blue-50" :
                          selectedFile.type.startsWith('video/') ? "bg-red-50" :
                          selectedFile.type.startsWith('audio/') ? "bg-purple-50" :
                          selectedFile.type === 'application/pdf' ? "bg-orange-50" :
                          "bg-muted/50"
                        )}>
                          {getFileIcon(selectedFile.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{selectedFile.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={handleFileUpload}
                          disabled={isUploadingAttachment}
                        >
                          {isUploadingAttachment ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                          <span className="xs:hidden">Add</span>
                          <span className="hidden xs:inline">Upload</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Attachments list with improved styling */}
                  {task.attachments && task.attachments.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {task.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="border rounded-md p-2.5 flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3 group hover:bg-muted/30 transition-colors"
                        >
                          <div className={cn(
                            "h-9 w-9 rounded flex items-center justify-center flex-shrink-0",
                            attachment.fileType.startsWith('image/') ? "bg-blue-50" :
                            attachment.fileType.startsWith('video/') ? "bg-red-50" :
                            attachment.fileType.startsWith('audio/') ? "bg-purple-50" :
                            attachment.fileType === 'application/pdf' ? "bg-orange-50" :
                            "bg-muted/50"
                          )}>
                            {getFileIcon(attachment.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{attachment.filename}</div>
                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1">
                              <span>{formatFileSize(attachment.fileSize)}</span>
                              <span className="hidden xs:inline">•</span>
                              <span>
                                {format(new Date(attachment.createdAt), "MMM d, yyyy")}
                              </span>
                              {attachment.user && (
                                <>
                                  <span className="hidden xs:inline">•</span>
                                  <span className="truncate w-full xs:w-auto">
                                    <span className="xs:hidden">Added by: </span>
                                    <span className="hidden xs:inline">Added by </span>
                                    {attachment.user.name || attachment.user.email}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                              title="Download"
                              onClick={() => window.open(attachment.fileUrl, '_blank')}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                              title="Delete"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Paperclip className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No files attached yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload files to share with the team
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Upload File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {task.activities && task.activities.length > 0 ? (
                    <div className="relative pl-6 border-l border-muted space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {(task.activities || []).map((activity, index) => {
                        // Group activities by date
                        const activityDate = new Date(activity.createdAt);
                        const prevActivityDate = index > 0 ? new Date((task.activities || [])[index - 1].createdAt) : null;
                        const showDateHeader = !prevActivityDate ||
                          activityDate.toDateString() !== prevActivityDate.toDateString();

                        // Get icon based on activity type
                        const getActivityIcon = () => {
                          switch (activity.action) {
                            case 'created':
                              return <Plus className="h-4 w-4" />;
                            case 'updated':
                              return <Edit className="h-4 w-4" />;
                            case 'deleted':
                              return <Trash className="h-4 w-4" />;
                            case 'completion_toggled':
                              return <CheckCircle className="h-4 w-4" />;
                            case 'comment_added':
                              return <MessageSquare className="h-4 w-4" />;
                            case 'attachment_added':
                              return <Paperclip className="h-4 w-4" />;
                            default:
                              return <Info className="h-4 w-4" />;
                          }
                        };

                        return (
                          <React.Fragment key={activity.id}>
                            {showDateHeader && (
                              <div className="relative -left-6 mb-4 mt-6 first:mt-0">
                                <div className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded inline-block">
                                  {format(activityDate, "MMMM d, yyyy")}
                                </div>
                              </div>
                            )}
                            <div className="relative">
                              <div className="absolute -left-10 mt-1 w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                                {getActivityIcon()}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    {activity.user?.image ? (
                                      <AvatarImage src={activity.user.image} alt={activity.user.name || "User"} />
                                    ) : null}
                                    <AvatarFallback className="text-xs">
                                      {activity.user?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {activity.user?.name || "Someone"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(activityDate, "h:mm a")}
                                  </span>
                                </div>
                                <p className="text-sm mt-1 ml-8">
                                  {activity.action === 'created' && "created this task"}
                                  {activity.action === 'updated' && "updated this task"}
                                  {activity.action === 'deleted' && "deleted an item"}
                                  {activity.action === 'completion_toggled' && activity.description}
                                  {activity.action === 'comment_added' && "added a comment"}
                                  {activity.action === 'attachment_added' && "added an attachment"}
                                  {!['created', 'updated', 'deleted', 'completion_toggled', 'comment_added', 'attachment_added'].includes(activity.action) &&
                                    (activity.description || `performed action: ${activity.action}`)}
                                </p>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No activity recorded yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Activity will be tracked when changes are made to this task
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4 order-1 lg:order-2">
          {/* Enhanced Task Details Card */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Details</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 lg:hidden"
                  onClick={() => {
                    // Scroll to the details section on mobile
                    window.scrollTo({
                      top: document.querySelector('.task-details-card')?.getBoundingClientRect().top
                        + window.scrollY - 80,
                      behavior: 'smooth'
                    });
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 sm:p-4 space-y-4 text-sm task-details-card">
              {/* Parent Task - with improved styling */}
              {task.parent && (
                <div className="bg-muted/30 rounded-md p-2.5 border-l-2 border-primary">
                  <div className="text-xs text-muted-foreground font-medium">Parent Task</div>
                  <Link
                    href={`/tasks/${task.parent.id}`}
                    className="text-sm font-medium hover:underline flex items-center mt-1.5 text-primary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    <span className="truncate">{task.parent.title}</span>
                  </Link>
                </div>
              )}

              {/* Project information */}
              <div className="bg-muted/30 rounded-md p-2.5">
                <div className="text-xs text-muted-foreground font-medium mb-1.5">Project</div>
                <Link
                  href={`/projects/${task.projectId}`}
                  className="flex items-center gap-1.5 text-sm hover:underline"
                >
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{task.project.title}</span>
                </Link>
              </div>

              {/* Dates section - with improved styling */}
              <div className="bg-muted/30 rounded-md p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs text-muted-foreground font-medium">Due Date</div>
                  {task.dueDate && new Date(task.dueDate) < new Date() && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Overdue</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{task.dueDate ? formatDate(task.dueDate) : "Not set"}</span>
                </div>
              </div>

              {/* Time tracking - with improved styling */}
              <div className="bg-muted/30 rounded-md p-2.5">
                <div className="text-xs text-muted-foreground font-medium mb-1.5">Time Tracking</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{task.timeSpent || 0}h spent</span>
                  </div>
                  {task.estimatedTime && task.estimatedTime > 0 && (
                    <span className="text-xs text-muted-foreground">
                      of {task.estimatedTime}h estimated
                    </span>
                  )}
                </div>

                {/* Enhanced progress bar */}
                {task.estimatedTime && task.estimatedTime > 0 && (
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full",
                        (task.timeSpent || 0) > task.estimatedTime ? "bg-destructive" : "bg-primary"
                      )}
                      style={{
                        width: `${Math.min(100, ((task.timeSpent || 0) / task.estimatedTime) * 100)}%`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Assignees - with improved styling */}
              <div className="bg-muted/30 rounded-md p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground font-medium">Assignees</div>
                  <Button
                    className="h-7 px-2 text-xs bg-black hover:bg-black/90 text-white"
                    size="sm"
                    onClick={() => {
                      // This would open an assignee selection dialog in a real implementation
                      toast({
                        title: "Feature coming soon",
                        description: "Adding assignees will be implemented in a future update",
                      });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>

                {task.assignees && task.assignees.length > 0 ? (
                  <div className="space-y-2.5">
                    {task.assignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center justify-between group bg-background rounded-md p-1.5 pr-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border border-black/10">
                            {assignee.user.image ? (
                              <AvatarImage src={assignee.user.image} alt={assignee.user.name || "User"} />
                            ) : null}
                            <AvatarFallback className="text-[10px]">
                              {assignee.user.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{assignee.user.name || "Unnamed User"}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            // This would remove the assignee in a real implementation
                            toast({
                              title: "Feature coming soon",
                              description: "Removing assignees will be implemented in a future update",
                            });
                          }}
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-3 bg-background rounded-md">
                    No assignees yet
                  </div>
                )}
              </div>

              {/* Metadata - with improved styling */}
              <div className="bg-muted/30 rounded-md p-2.5 text-xs text-muted-foreground">
                <div className="flex justify-between mb-1.5">
                  <span className="font-medium">Created</span>
                  <span>{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated</span>
                  <span>{format(new Date(task.updatedAt), "MMM d, yyyy")}</span>
                </div>
              </div>

              {/* Quick actions - with improved styling */}
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-sm flex-1"
                  onClick={() => {
                    // This would open a time logging dialog in a real implementation
                    toast({
                      title: "Feature coming soon",
                      description: "Time logging will be implemented in a future update",
                    });
                  }}
                >
                  <Clock className="h-4 w-4 mr-1.5" />
                  Log Time
                </Button>
                <Button
                  size="sm"
                  className="h-9 text-sm flex-1 bg-black hover:bg-black/90 text-white"
                  onClick={handleEditTask}
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {task && isEditDialogOpen && (
            <TaskForm
              projectId={task.projectId}
              taskId={task.id}
              onSuccess={handleEditDialogClose}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>


    </div>
  )
}
