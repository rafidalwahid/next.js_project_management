"use client"

import { useState, useEffect, useRef } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Plus, MoreHorizontal, Clock, Calendar, User, Pencil, Trash, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { CreateStatusDialog } from "@/components/project/create-status-dialog"
import { QuickTaskDialog } from "@/components/project/quick-task-dialog"
import { AssignMembersPopup } from "@/components/project/assign-members-popup"
import { taskApi } from "@/lib/api"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  initialTasks?: Task[]
  initialStatuses?: ProjectStatus[]
  onTasksChange?: (tasks: Task[]) => void
  onStatusesChange?: (statuses: ProjectStatus[]) => void
  onRefresh?: () => Promise<void>
}

export function KanbanBoard({
  projectId,
  onCreateTask,
  onEditTask,
  initialTasks,
  initialStatuses,
  onTasksChange,
  onStatusesChange,
  onRefresh
}: KanbanBoardProps) {
  const [statuses, setStatuses] = useState<ProjectStatus[]>(initialStatuses || [])
  const [tasks, setTasks] = useState<Task[]>(initialTasks || [])
  const [isLoading, setIsLoading] = useState(!initialTasks || !initialStatuses)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [editingStatusName, setEditingStatusName] = useState<string>("")
  const [deleteStatusId, setDeleteStatusId] = useState<string | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const statusInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Update local state when props change
  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks)
    }
  }, [initialTasks])

  useEffect(() => {
    if (initialStatuses) {
      setStatuses(initialStatuses)
    }
  }, [initialStatuses])

  // Focus input when editing status
  useEffect(() => {
    if (editingStatusId && statusInputRef.current) {
      statusInputRef.current.focus()
    }
  }, [editingStatusId])

  // Fetch statuses and tasks
  const fetchData = async () => {
    try {
      // If onRefresh is provided, use it
      if (onRefresh) {
        await onRefresh()
        setIsLoading(false)
        return
      }

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

      const newStatuses = statusesData.statuses || []
      const newTasks = tasksData.tasks || []

      setStatuses(newStatuses)
      setTasks(newTasks)

      // Notify parent components of changes
      if (onTasksChange) {
        onTasksChange(newTasks)
      }

      if (onStatusesChange) {
        onStatusesChange(newStatuses)
      }
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

  // Load data on component mount if initialTasks and initialStatuses are not provided
  useEffect(() => {
    if (projectId && (!initialTasks || !initialStatuses)) {
      fetchData()
    }
  }, [projectId, initialTasks, initialStatuses])

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

          // Notify parent component of changes
          if (onTasksChange) {
            onTasksChange(updatedTasks)
          }
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
    // Handle reordering within the same column
    else if (source.droppableId === destination.droppableId) {
      try {
        // Get all tasks in the current status
        const tasksInStatus = getTasksByStatus(source.droppableId)

        // Optimistically update the UI
        const updatedTasks = [...tasks]

        // Find the task being moved
        const movedTask = tasksInStatus[source.index]

        // Find the target task (if any)
        const targetTask = destination.index < tasksInStatus.length
          ? tasksInStatus[destination.index]
          : null

        // Update the tasks array with the new order
        const newTasksInStatus = Array.from(tasksInStatus)
        newTasksInStatus.splice(source.index, 1)
        newTasksInStatus.splice(destination.index, 0, movedTask)

        // Update the tasks array
        const newTasks = tasks.filter(t => t.statusId !== source.droppableId)
        newTasks.push(...newTasksInStatus)
        setTasks(newTasks)

        // Notify parent component of changes
        if (onTasksChange) {
          onTasksChange(newTasks)
        }

        // Call the reorder API using taskApi
        await taskApi.reorderTask(
          taskId,
          null, // newParentId
          null, // oldParentId
          targetTask?.id || null, // targetTaskId
          true // isSameParentReorder
        )

        // Refresh data to ensure we have the latest state
        await fetchData()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to reorder task",
          variant: "destructive"
        })
        // Refresh data to ensure we have the correct state
        await fetchData()
      }
    }
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

      // Notify parent component of changes
      if (onTasksChange) {
        onTasksChange(updatedTasks)
      }

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

  // Update task assignees
  const updateTaskAssignees = async (taskId: string, assigneeIds: string[]) => {
    try {
      // Optimistically update the UI
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          // Create new assignees array with the updated user IDs
          const updatedAssignees = assigneeIds.map(userId => {
            // Try to find existing assignee to preserve data
            const existingAssignee = task.assignees?.find(a => a.user.id === userId);
            if (existingAssignee) return existingAssignee;

            // Find user data from another task's assignees if available
            const userFromOtherTask = tasks.flatMap(t => t.assignees || [])
              .find(a => a.user.id === userId);

            if (userFromOtherTask) return userFromOtherTask;

            // Create minimal assignee object if user not found
            return {
              id: `temp-${userId}`,
              user: {
                id: userId,
                name: null,
                email: "",
                image: null
              }
            };
          });

          return { ...task, assignees: updatedAssignees };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Notify parent component of changes
      if (onTasksChange) {
        onTasksChange(updatedTasks);
      }

      // Update on the server
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeIds })
      });

      if (!response.ok) {
        throw new Error("Failed to update task assignees");
      }

      toast({
        title: "Task updated",
        description: "Task assignees updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task assignees",
        variant: "destructive"
      });
      // Refresh data to ensure we have the correct state
      await fetchData();
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

  // Handle status creation
  const handleStatusCreated = () => {
    // Refresh data when a new status is created
    fetchData();
  };

  // Start editing a status
  const handleEditStatus = (status: ProjectStatus) => {
    setEditingStatusId(status.id);
    setEditingStatusName(status.name);
  };

  // Save edited status
  const handleSaveStatusName = async () => {
    if (!editingStatusId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/statuses/${editingStatusId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingStatusName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setStatuses(prev =>
        prev.map(status =>
          status.id === editingStatusId
            ? { ...status, name: editingStatusName }
            : status
        )
      );

      // Notify parent component
      if (onStatusesChange) {
        onStatusesChange(statuses.map(status =>
          status.id === editingStatusId
            ? { ...status, name: editingStatusName }
            : status
        ));
      }

      toast({
        title: "Status updated",
        description: "Status name has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setEditingStatusId(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingStatusId(null);
  };

  // Delete status
  const handleDeleteStatus = async () => {
    if (!deleteStatusId) return;

    try {
      // Check if status has tasks
      const tasksInStatus = tasks.filter(task => task.statusId === deleteStatusId);

      if (tasksInStatus.length > 0) {
        toast({
          title: "Cannot delete status",
          description: "This status contains tasks. Move or delete them first.",
          variant: "destructive",
        });
        setDeleteStatusId(null);
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/statuses/${deleteStatusId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete status");
      }

      // Update local state
      const updatedStatuses = statuses.filter(status => status.id !== deleteStatusId);
      setStatuses(updatedStatuses);

      // Notify parent component
      if (onStatusesChange) {
        onStatusesChange(updatedStatuses);
      }

      toast({
        title: "Status deleted",
        description: "Status has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete status",
        variant: "destructive",
      });
    } finally {
      setDeleteStatusId(null);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      const response = await fetch(`/api/tasks/${deleteTaskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      // Update local state
      const updatedTasks = tasks.filter(task => task.id !== deleteTaskId);
      setTasks(updatedTasks);

      // Notify parent component
      if (onTasksChange) {
        onTasksChange(updatedTasks);
      }

      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setDeleteTaskId(null);
    }
  };

  return (
    <div className="space-y-6">

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="h-[500px] sm:h-[600px] max-h-[calc(100vh-240px)] overflow-hidden">
          <div className="flex overflow-x-auto pb-4 gap-4 sm:gap-6 snap-x scrollbar scrollbar-thumb-gray-300 scrollbar-track-transparent h-full pr-2 sm:pr-4 pl-1 -ml-1">
          {statuses.sort((a, b) => a.order - b.order).map((status) => (
            <div key={status.id} className="flex flex-col h-full min-w-[260px] sm:min-w-[300px] snap-start shadow-md rounded-md">
              <div
                className="flex items-center justify-between p-3 rounded-t-md"
                style={{ backgroundColor: status.color + "20" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />

                  {editingStatusId === status.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        ref={statusInputRef}
                        value={editingStatusName}
                        onChange={(e) => setEditingStatusName(e.target.value)}
                        className="h-7 w-[120px] py-1 px-2 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveStatusName();
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleSaveStatusName}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <h3 className="font-medium">{status.name}</h3>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {getTasksByStatus(status.id).length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {!editingStatusId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStatus(status)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteStatusId(status.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <QuickTaskDialog
                    projectId={projectId}
                    statusId={status.id}
                    statusName={status.name}
                    onTaskCreated={fetchData}
                  />
                </div>
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
                              className={`bg-background p-2 sm:p-3 rounded-md shadow-sm mb-2 border-l-4 flex flex-col min-h-[120px] ${
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
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toggleTaskCompletion(task.id, task.completed)}>
                                      <Check className="mr-2 h-4 w-4" />
                                      Mark as {task.completed ? "Incomplete" : "Complete"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setDeleteTaskId(task.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 mt-2 flex-grow">
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

                              <div className="flex justify-end mt-3">
                                <div className="flex -space-x-2">
                                  {task.assignees && task.assignees.length > 0 ? (
                                    <>
                                      {task.assignees.slice(0, 3).map((assignee) => (
                                        <Avatar key={assignee.id} className="h-7 w-7 border border-black">
                                          <AvatarImage src={assignee.user.image || undefined} />
                                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                            {assignee.user.name?.substring(0, 2) || assignee.user.email.substring(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                      {task.assignees.length > 3 && (
                                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border border-black">
                                          +{task.assignees.length - 3}
                                        </div>
                                      )}
                                    </>
                                  ) : null}
                                  <AssignMembersPopup
                                    projectId={projectId}
                                    taskId={task.id}
                                    currentAssignees={task.assignees?.map(a => a.user.id) || []}
                                    onAssigneesChange={(assigneeIds) => updateTaskAssignees(task.id, assigneeIds)}
                                  />
                                </div>
                              </div>
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

      {/* Delete Status Confirmation Dialog */}
      <AlertDialog open={!!deleteStatusId} onOpenChange={(open) => !open && setDeleteStatusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this status? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStatus} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
