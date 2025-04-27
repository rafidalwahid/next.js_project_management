"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Plus, MoreHorizontal, Clock, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { CreateStatusDialog } from "@/components/project/create-status-dialog"
import { QuickTaskDialog } from "@/components/project/quick-task-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { format } from "date-fns"

interface ProjectStatus {
  id: string
  name: string
  color: string
  description?: string | null
  order: number
  isDefault: boolean
}

interface TaskAssignee {
  id: string
  taskId: string
  userId: string
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
  order: number
  completed: boolean
  assignees?: TaskAssignee[]
  status?: ProjectStatus | null
}

interface KanbanBoardProps {
  projectId: string
  onCreateTask?: () => void
  onEditTask?: (taskId: string) => void
}

export function KanbanBoard({ projectId, onCreateTask, onEditTask }: KanbanBoardProps) {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Fetch statuses and tasks
  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch statuses
      const statusesResponse = await fetch(`/api/projects/${projectId}/statuses`)
      if (!statusesResponse.ok) {
        throw new Error("Failed to fetch statuses")
      }
      const statusesData = await statusesResponse.json()

      // Fetch tasks
      const tasksResponse = await fetch(`/api/tasks?projectId=${projectId}&limit=100`)
      if (!tasksResponse.ok) {
        throw new Error("Failed to fetch tasks")
      }
      const tasksData = await tasksResponse.json()

      setStatuses(statusesData.statuses || [])
      setTasks(tasksData.tasks || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  // Group tasks by status
  const getTasksByStatus = (statusId: string) => {
    return tasks.filter(task => task.statusId === statusId)
      .sort((a, b) => a.order - b.order)
  }

  // Handle task drag and drop
  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result

    // Dropped outside a droppable area
    if (!destination) return

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return

    // Get the task that was dragged
    const taskId = draggableId

    // If the status changed (moved to a different column)
    if (source.droppableId !== destination.droppableId) {
      try {
        // Optimistically update the UI
        const updatedTasks = [...tasks]
        const taskIndex = updatedTasks.findIndex(t => t.id === taskId)

        if (taskIndex !== -1) {
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            statusId: destination.droppableId
          }
          setTasks(updatedTasks)
        }

        // Update the task status on the server
        const response = await fetch(`/api/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId: destination.droppableId })
        })

        if (!response.ok) {
          throw new Error("Failed to update task status")
        }

        // Refresh data to ensure we have the latest state
        await fetchData()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update task status",
          variant: "destructive"
        })
        // Refresh data to ensure we have the correct state
        await fetchData()
      }
    }

    // TODO: Handle reordering within the same column
  }

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null
    return format(new Date(dateString), "MMM d, yyyy")
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Handle task completion toggle
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      // Optimistically update the UI
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, completed: !completed } : task
      )
      setTasks(updatedTasks)

      // Update on the server
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed })
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive"
      })
      // Refresh data to ensure we have the correct state
      await fetchData()
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (statuses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center mb-4">
            No statuses defined for this project. Create statuses to start organizing tasks.
          </p>
          <Button onClick={() => window.location.href = `/projects/${projectId}/settings`}>
            Manage Project Statuses
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Import the CreateStatusDialog component
  const handleStatusCreated = () => {
    // Refresh data when a new status is created
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <div className="flex items-center gap-2">
          {statuses.length > 3 && (
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              Scroll horizontally to see all {statuses.length} columns
            </span>
          )}
          <CreateStatusDialog
            projectId={projectId}
            onStatusCreated={handleStatusCreated}
          />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="h-[600px] max-h-[calc(100vh-240px)] overflow-hidden">
          <div className="flex overflow-x-auto pb-4 gap-6 snap-x scrollbar scrollbar-thumb-gray-300 scrollbar-track-transparent h-full pr-4 pl-1 -ml-1" title="Scroll horizontally to see more columns">
          {statuses.sort((a, b) => a.order - b.order).map((status) => (
            <div key={status.id} className="flex flex-col h-full min-w-[300px] snap-start shadow-md rounded-md">
              <div
                className="flex items-center justify-between p-3 rounded-t-md"
                style={{ backgroundColor: status.color + "20" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="font-medium">{status.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {getTasksByStatus(status.id).length}
                  </span>
                </div>
                <QuickTaskDialog
                  projectId={projectId}
                  statusId={status.id}
                  statusName={status.name}
                  onTaskCreated={fetchData}
                />
              </div>

              <Droppable droppableId={status.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 bg-muted/30 p-2 rounded-b-md h-[calc(100%-40px)] overflow-y-auto"
                  >
                    {getTasksByStatus(status.id).length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No tasks
                      </div>
                    ) : (
                      getTasksByStatus(status.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-background p-3 rounded-md shadow-sm mb-2 border-l-4 ${
                                task.completed ? "opacity-60" : ""
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                borderLeftColor: task.status?.color || "#6E56CF"
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleTaskCompletion(task.id, task.completed)}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                  <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                                    {task.title}
                                  </span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEditTask && onEditTask(task.id)}>
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toggleTaskCompletion(task.id, task.completed)}>
                                      Mark as {task.completed ? "Incomplete" : "Complete"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>

                                {task.dueDate && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(task.dueDate)}
                                  </Badge>
                                )}

                                {task.estimatedTime && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {task.estimatedTime}h
                                  </Badge>
                                )}
                              </div>

                              {task.assignees && task.assignees.length > 0 && (
                                <div className="flex -space-x-2 mt-3">
                                  {task.assignees.slice(0, 3).map((assignee) => (
                                    <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                                      <AvatarImage src={assignee.user.image || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {assignee.user.name?.substring(0, 2) || assignee.user.email.substring(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {task.assignees.length > 3 && (
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                      +{task.assignees.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}
