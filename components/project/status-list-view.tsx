"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  rectIntersection,
  DragOverEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  MoreHorizontal,
  GripVertical,
  Pencil,
  Trash,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { QuickTaskDialog } from "@/components/project/quick-task-dialog"
import { taskApi } from "@/lib/api"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  createdAt: string
  updatedAt: string
  assignees?: TaskAssignee[]
  status?: {
    id: string
    name: string
    color: string
  } | null
}

interface TaskAssignee {
  id: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface ProjectStatus {
  id: string
  name: string
  color: string
  description?: string | null
  order: number
  isDefault: boolean
  projectId: string
}

interface StatusListViewProps {
  projectId: string
  statuses: ProjectStatus[]
  tasks: Task[]
  isLoading: boolean
  onEditTask?: (taskId: string) => void
  onRefresh: () => Promise<void>
}

// Task item component that can be dragged
function DraggableTaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  task: Task
  onToggleComplete: (taskId: string, completed: boolean) => void
  onEdit?: (taskId: string) => void
  onDelete?: (taskId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  })

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

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`mb-2 rounded-md border bg-background p-3 shadow-sm ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div {...listeners} className="mt-1 cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id, task.completed)}
              />
              <span className={task.completed ? "line-through text-muted-foreground" : "font-medium"}>
                {task.title}
              </span>
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
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
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit && onEdit(task.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleComplete(task.id, task.completed)}>
              <Check className="mr-2 h-4 w-4" />
              Mark as {task.completed ? "Incomplete" : "Complete"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete && onDelete(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.assignees && task.assignees.length > 0 && (
        <div className="flex -space-x-2 mt-3 ml-7">
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
  )
}

// Status section component with collapsible task list
function StatusSection({
  status,
  tasks,
  onToggleComplete,
  onEdit,
  onCreateTask,
  isOpen,
  onToggle,
  onEditStatus,
  onDeleteStatus,
  onDeleteTask,
  isEditing,
  editingName,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
}: {
  status: ProjectStatus
  tasks: Task[]
  onToggleComplete: (taskId: string, completed: boolean) => void
  onEdit?: (taskId: string) => void
  onCreateTask: () => void
  isOpen: boolean
  onToggle: () => void
  onEditStatus: (status: ProjectStatus) => void
  onDeleteStatus: (statusId: string) => void
  onDeleteTask: (taskId: string) => void
  isEditing: boolean
  editingName: string
  onEditingNameChange: (value: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}) {
  // Reference for the status input field
  const statusInputRef = useRef<HTMLInputElement>(null);

  // Make the status section a droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status.id}`,
    data: {
      type: 'status',
      status,
    },
  });

  // Force the section to be open when dragging over it
  useEffect(() => {
    if (isOver && !isOpen) {
      onToggle();
    }
  }, [isOver, isOpen]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className={`mb-4 ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <div
        className="flex items-center justify-between rounded-t-md p-3"
        style={{ backgroundColor: status.color + "20" }}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2 flex-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: status.color }}
          />

          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                ref={statusInputRef}
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                className="h-7 w-[120px] py-1 px-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSaveEdit();
                  } else if (e.key === "Escape") {
                    onCancelEdit();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onSaveEdit}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onCancelEdit}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <h3 className="font-medium">{status.name}</h3>
          )}

          <Badge variant="outline">{tasks.length}</Badge>
        </div>

        <div className="flex items-center gap-1">
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditStatus(status)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteStatus(status.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <QuickTaskDialog
            projectId={status.projectId}
            statusId={status.id}
            statusName={status.name}
            onTaskCreated={onCreateTask}
          />
        </div>
      </div>
      <CollapsibleContent>
        <div
          ref={setNodeRef}
          className={`rounded-b-md border border-t-0 p-2 min-h-[100px] transition-colors duration-200
            ${isOver ? 'bg-primary/10 border-primary/30 border-2' : tasks.length === 0 ? 'bg-muted/20 border-dashed border-2' : ''}`}
          data-status-id={status.id}
          data-droppable="true"
        >
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-sm">
              <div className={`p-4 rounded-md border-2 ${isOver ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30'}`}>
                <p className={isOver ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  No tasks in this status
                </p>
                <p className={`text-xs mt-2 ${isOver ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {isOver ? '✓ Drop here to add task' : 'Drop tasks here'}
                </p>
              </div>
            </div>
          ) : (
            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <DraggableTaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDeleteTask}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function StatusListView({
  projectId,
  statuses,
  tasks,
  isLoading,
  onEditTask,
  onRefresh
}: StatusListViewProps) {
  const [openStatuses, setOpenStatuses] = useState<Record<string, boolean>>({})
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [editingStatusName, setEditingStatusName] = useState<string>("")
  const [deleteStatusId, setDeleteStatusId] = useState<string | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const statusInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize all statuses as open
  useEffect(() => {
    const initialOpenState: Record<string, boolean> = {};
    statuses.forEach(status => {
      initialOpenState[status.id] = true;
    });
    setOpenStatuses(initialOpenState);
  }, [statuses]);

  // Group tasks by status
  const getTasksByStatus = (statusId: string) => {
    return tasks
      .filter(task => task.statusId === statusId)
      .sort((a, b) => a.order - b.order);
  }

  // Toggle status section open/closed
  const toggleStatus = (statusId: string) => {
    setOpenStatuses(prev => ({
      ...prev,
      [statusId]: !prev[statusId]
    }));
  }

  // Auto-open a status when dragging over it
  useEffect(() => {
    if (activeStatusId && !openStatuses[activeStatusId]) {
      setOpenStatuses(prev => ({
        ...prev,
        [activeStatusId]: true
      }));
    }
  }, [activeStatusId, openStatuses]);

  // Focus input when editing status
  useEffect(() => {
    if (editingStatusId && statusInputRef.current) {
      statusInputRef.current.focus();
      statusInputRef.current.select();
    }
  }, [editingStatusId]);

  // Handle task completion toggle
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      console.log(`Toggling task completion: ${taskId}, current state: ${completed}`);

      // Update on the server
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to update task completion:", errorData);
        throw new Error(errorData.error || "Failed to update task");
      }

      // Refresh data
      await onRefresh();

      toast({
        title: `Task marked as ${!completed ? "completed" : "incomplete"}`,
        description: "Task status updated successfully",
      })
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive"
      })
    }
  }

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before activation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay for touch
        tolerance: 5, // 5px of movement allowed during delay
      },
    }),
    useSensor(KeyboardSensor, {})
  )

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
    }
  }

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (!over) return;

    console.log('Drag over event:', {
      overId: over.id,
      isStatusContainer: over.id.toString().startsWith('status-'),
      data: over.data.current,
    });

    // Check if we're over a status container
    if (over.id.toString().startsWith('status-')) {
      const statusId = over.id.toString().replace('status-', '');
      setActiveStatusId(statusId);

      // Make sure the status is open
      if (!openStatuses[statusId]) {
        setOpenStatuses(prev => ({
          ...prev,
          [statusId]: true
        }));
      }
    } else {
      // If over a task, find its status
      const overTask = tasks.find(task => task.id === over.id);
      if (overTask && overTask.statusId) {
        setActiveStatusId(overTask.statusId);
      }
    }
  }

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

      // Refresh data
      await onRefresh();

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
      console.log(`Attempting to delete status: ${deleteStatusId}`);

      // Check if status has tasks
      const tasksInStatus = tasks.filter(task => task.statusId === deleteStatusId);
      console.log(`Status has ${tasksInStatus.length} tasks`);

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
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to delete status:", errorData);
        throw new Error(errorData.error || "Failed to delete status");
      }

      // Refresh data
      await onRefresh();

      toast({
        title: "Status deleted",
        description: "Status has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting status:", error);
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
      console.log(`Deleting task: ${deleteTaskId}`);

      const response = await fetch(`/api/tasks/${deleteTaskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to delete task:", errorData);
        throw new Error(errorData.error || "Failed to delete task");
      }

      // Refresh data
      await onRefresh();

      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setDeleteTaskId(null);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('Drag end event:', {
      activeId: active.id,
      overId: over?.id,
      isStatusContainer: over?.id.toString().startsWith('status-'),
    });

    if (!over) {
      setActiveTask(null);
      setActiveStatusId(null);
      return;
    }

    // Find the task being dragged
    const draggedTask = tasks.find(task => task.id === active.id);
    if (!draggedTask) {
      setActiveTask(null);
      setActiveStatusId(null);
      return;
    }

    // Check if dropping onto a status container
    if (over.id.toString().startsWith('status-')) {
      const newStatusId = over.id.toString().replace('status-', '');

      // If the status is changing
      if (draggedTask.statusId !== newStatusId) {
        try {
          // Update the task status on the server
          const response = await fetch(`/api/tasks/${draggedTask.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statusId: newStatusId })
          });

          if (!response.ok) {
            throw new Error("Failed to update task status");
          }

          // Refresh data
          await onRefresh();

          toast({
            title: "Task moved",
            description: `Task moved to ${statuses.find(s => s.id === newStatusId)?.name || 'new status'}`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to move task",
            variant: "destructive"
          });
        }
      }
    }
    // If dropping onto another task
    else {
      // Find the task being dropped onto
      const targetTask = tasks.find(task => task.id === over.id);

      if (targetTask) {
        // If the status is changing (moving to a different status)
        if (draggedTask.statusId !== targetTask.statusId) {
          try {
            // Update the task status on the server
            const response = await fetch(`/api/tasks/${draggedTask.id}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ statusId: targetTask.statusId })
            });

            if (!response.ok) {
              throw new Error("Failed to update task status");
            }

            // Now reorder within the new status
            await taskApi.reorderTask(
              draggedTask.id,
              null, // newParentId
              null, // oldParentId
              targetTask.id, // targetTaskId
              true // isSameParentReorder
            );

            // Refresh data
            await onRefresh();

            toast({
              title: "Task moved",
              description: `Task moved to ${targetTask.status?.name || 'new status'}`,
            });
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to move task",
              variant: "destructive"
            });
          }
        }
        // If just reordering within the same status
        else {
          try {
            await taskApi.reorderTask(
              draggedTask.id,
              null, // newParentId
              null, // oldParentId
              targetTask.id, // targetTaskId
              true // isSameParentReorder
            );

            // Refresh data
            await onRefresh();
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to reorder task",
              variant: "destructive"
            });
          }
        }
      }
    }

    setActiveTask(null);
    setActiveStatusId(null);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {statuses.sort((a, b) => a.order - b.order).map((status) => (
          <StatusSection
            key={status.id}
            status={status}
            tasks={getTasksByStatus(status.id)}
            onToggleComplete={toggleTaskCompletion}
            onEdit={onEditTask}
            onCreateTask={onRefresh}
            isOpen={!!openStatuses[status.id]}
            onToggle={() => toggleStatus(status.id)}
            onEditStatus={handleEditStatus}
            onDeleteStatus={(statusId) => setDeleteStatusId(statusId)}
            onDeleteTask={(taskId) => setDeleteTaskId(taskId)}
            isEditing={editingStatusId === status.id}
            editingName={editingStatusName}
            onEditingNameChange={setEditingStatusName}
            onSaveEdit={handleSaveStatusName}
            onCancelEdit={handleCancelEdit}
          />
        ))}

        {/* Drag overlay for the currently dragged task */}
        <DragOverlay>
          {activeTask && (
            <div className="rounded-md border bg-background p-3 shadow-md w-full max-w-md opacity-90">
              <div className="flex items-center gap-2">
                <Checkbox checked={activeTask.completed} />
                <span className={activeTask.completed ? "line-through text-muted-foreground" : "font-medium"}>
                  {activeTask.title}
                </span>
              </div>
              {activeStatusId && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Moving to: {statuses.find(s => s.id === activeStatusId)?.name || 'new status'}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
