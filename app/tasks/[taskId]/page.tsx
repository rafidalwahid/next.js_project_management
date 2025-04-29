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
  XCircle,
  MessageSquare,
  Paperclip,
  Users,
  Plus,
  Info,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText as FileTextIcon,
  Table as TableIcon,
  File as FileIcon,
  BarChart as BarChartIcon,
  Send,
  Download,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskForm } from "@/components/project/task-form-fixed"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubtaskList } from "@/components/tasks/subtask-list"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import React from "react"

interface TaskAssignee {
  id: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface Subtask {
  id: string
  title: string
  description?: string | null
  priority: string
  completed: boolean
  dueDate?: string | null
  assignees?: TaskAssignee[]
  subtasks?: Subtask[]
  parentId?: string | null
  projectId: string
}

interface TaskComment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface TaskAttachment {
  id: string
  filename: string
  fileUrl: string
  fileSize: number
  fileType: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  startDate?: string | null
  endDate?: string | null
  dueDate?: string | null
  timeSpent?: number | null
  estimatedTime?: number | null
  projectId: string
  statusId?: string | null
  parentId?: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
  project: {
    id: string
    title: string
  }
  status?: {
    id: string
    name: string
    color: string
  } | null
  parent?: {
    id: string
    title: string
  } | null
  assignees?: TaskAssignee[]
  subtasks?: Subtask[]
  activities?: any[]
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.taskId as string
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
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
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCompletion}
                className="h-6 w-6"
              >
                {task.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                )}
              </Button>
            </div>
            <div className="flex-1">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 mt-2">
                <Badge variant="outline" className={cn("w-fit", getPriorityColor(task.priority))}>
                  {task.priority} priority
                </Badge>
                {task.dueDate && (
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    Due {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={handleEditTask} className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteTask} disabled={isDeleting} className="w-full sm:w-auto">
            {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash className="mr-2 h-4 w-4" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <div className="prose max-w-none">
                  {task.description}
                </div>
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="subtasks" className="space-y-6">
            <TabsList>
              <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="subtasks">
              <Card>
                <CardHeader>
                  <CardTitle>Subtasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubtaskList
                    parentTaskId={task.id}
                    projectId={task.projectId}
                    subtasks={task.subtasks || []}
                    onSubtaskChange={handleSubtaskChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-[300px] pr-4">
                    {task.comments && task.comments.length > 0 ? (
                      <div className="space-y-4">
                        {task.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8 border border-black/10">
                              {comment.user.image ? (
                                <AvatarImage src={comment.user.image} alt={comment.user.name || "User"} />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {comment.user.name?.split(" ").map(n => n[0]).join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {comment.user.name || comment.user.email}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                              <div className="mt-1 text-sm">
                                {comment.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
                    )}
                  </ScrollArea>

                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isAddingComment}
                        className="flex items-center gap-1"
                      >
                        {isAddingComment ? <Spinner className="h-4 w-4 mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                        Add Comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments">
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-md">
                    {task.attachments && task.attachments.length > 0 ? (
                      <div className="divide-y">
                        {task.attachments.map((attachment) => (
                          <div key={attachment.id} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-muted h-10 w-10 rounded-md flex items-center justify-center">
                                {getFileIcon(attachment.fileType)}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{attachment.filename}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>{formatFileSize(attachment.fileSize)}</span>
                                  <span>•</span>
                                  <span>
                                    Uploaded {format(new Date(attachment.createdAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Download"
                                onClick={() => window.open(attachment.fileUrl, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No attachments yet</p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <Label htmlFor="file-upload">Upload a file</Label>
                    <div className="flex gap-2">
                      <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        disabled={isUploadingAttachment}
                      />
                      <Button
                        onClick={handleFileUpload}
                        disabled={!selectedFile || isUploadingAttachment}
                      >
                        {isUploadingAttachment ? <Spinner className="h-4 w-4 mr-1" /> : null}
                        Upload
                      </Button>
                    </div>
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected file: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Project</dt>
                  <dd className="mt-1">
                    <Link href={`/projects/${task.project.id}`} className="hover:underline">
                      {task.project.title}
                    </Link>
                  </dd>
                </div>

                {task.status && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.status.color }}
                      />
                      {task.status.name}
                    </dd>
                  </div>
                )}

                {(task.startDate || task.endDate) && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Dates</dt>
                    <dd className="mt-1 space-y-1">
                      {task.startDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Start:</span> {formatDate(task.startDate)}
                        </div>
                      )}
                      {task.endDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">End:</span> {formatDate(task.endDate)}
                        </div>
                      )}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Time</dt>
                  <dd className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Spent:</span> {task.timeSpent || 0} hours
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Estimated:</span> {task.estimatedTime || 0} hours
                    </div>
                    {task.estimatedTime && task.estimatedTime > 0 && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(100, ((task.timeSpent || 0) / task.estimatedTime) * 100)}%`
                          }}
                        />
                      </div>
                    )}
                  </dd>
                </div>

                {task.assignees && task.assignees.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Assignees</dt>
                    <dd className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {task.assignees.map((assignee) => (
                          <div key={assignee.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                            <Avatar className="h-6 w-6 border border-black/10">
                              {assignee.user.image ? (
                                <AvatarImage src={assignee.user.image} alt={assignee.user.name || "User"} />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {assignee.user.name?.split(" ").map(n => n[0]).join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignee.user.name || assignee.user.email}</span>
                          </div>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}

                {task.activities && task.activities.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Recent Activity</dt>
                    <dd className="mt-2">
                      <ul className="space-y-2 text-sm">
                        {task.activities.slice(0, 3).map((activity) => (
                          <li key={activity.id} className="flex items-start gap-2">
                            <span className="text-muted-foreground">
                              {format(new Date(activity.createdAt), "MMM d, h:mm a")}:
                            </span>
                            <span>
                              {activity.user?.name || "Someone"} {activity.action} {activity.description ? activity.description : "this task"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              projectId={task.projectId}
              taskId={task.id}
              onSuccess={handleEditDialogClose}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
