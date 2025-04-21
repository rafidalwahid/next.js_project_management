"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { taskApi } from "@/lib/api"
import { Subtask } from "@/types/task"
import { DraggableSubtask } from "./draggable-subtask"

interface DraggableSubtaskListProps {
  parentTaskId: string
  projectId: string
  subtasks: Subtask[]
  onSubtaskChange: () => void
}

export function DraggableSubtaskList({
  parentTaskId,
  projectId,
  subtasks,
  onSubtaskChange
}: DraggableSubtaskListProps) {
  const { toast } = useToast()
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [addingNestedToId, setAddingNestedToId] = useState<string | null>(null)
  const [nestedSubtaskTitle, setNestedSubtaskTitle] = useState("")
  const [activeSubtask, setActiveSubtask] = useState<Subtask | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    })
  )

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return "U"

    const nameParts = name.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    return nameParts[0].substring(0, 2).toUpperCase()
  }

  const handleAddSubtask = async () => {
    const trimmedTitle = newSubtaskTitle.trim()
    if (!trimmedTitle) return

    // Validate title length
    if (trimmedTitle.length < 3) {
      toast({
        title: "Validation Error",
        description: "Subtask title must be at least 3 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      await taskApi.createTask({
        title: trimmedTitle,
        projectId,
        parentId: parentTaskId,
        status: "pending",
        priority: "medium",
      })

      setNewSubtaskTitle("")
      setIsAddingSubtask(false)
      onSubtaskChange()

      toast({
        title: "Subtask added",
        description: "Subtask has been added successfully",
      })
    } catch (error) {
      console.error("Error adding subtask:", error)
      toast({
        title: "Error",
        description: "Failed to add subtask. Please check the console for details.",
        variant: "destructive",
      })
    }
  }

  const handleAddNestedSubtask = async (parentSubtaskId: string) => {
    const trimmedTitle = nestedSubtaskTitle.trim()
    if (!trimmedTitle) return

    // Validate title length
    if (trimmedTitle.length < 3) {
      toast({
        title: "Validation Error",
        description: "Subtask title must be at least 3 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      await taskApi.createTask({
        title: trimmedTitle,
        projectId,
        parentId: parentSubtaskId,
        status: "pending",
        priority: "medium",
      })

      setNestedSubtaskTitle("")
      setAddingNestedToId(null)
      onSubtaskChange()

      toast({
        title: "Nested subtask added",
        description: "Nested subtask has been added successfully",
      })
    } catch (error) {
      console.error("Error adding nested subtask:", error)
      toast({
        title: "Error",
        description: "Failed to add nested subtask. Please check the console for details.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (subtaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed"

    try {
      await taskApi.updateTask(subtaskId, { status: newStatus })
      onSubtaskChange()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subtask status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    console.log('Deleting subtask with ID:', subtaskId);
    try {
      // Show loading toast
      const loadingToast = toast({
        title: "Deleting subtask",
        description: "Please wait...",
      });

      const result = await taskApi.deleteTask(subtaskId);
      console.log('Delete subtask API response:', result);
      onSubtaskChange();

      toast({
        title: "Subtask deleted",
        description: "Subtask has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);

      // Extract error message if available
      let errorMessage = "Failed to delete subtask";

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
      });
    }
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setIsDragging(true)

    // Find the subtask being dragged
    const draggedSubtask = subtasks.find(subtask => subtask.id === active.id)
    if (draggedSubtask) {
      setActiveSubtask(draggedSubtask)
    }
  }

  // Handle drag over (for changing parent or reordering)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // Find the subtasks - first check in the current level
    let activeSubtask = subtasks.find(subtask => subtask.id === active.id)
    let overSubtask = subtasks.find(subtask => subtask.id === over.id)

    // If active subtask not found at current level, search deeper
    if (!activeSubtask) {
      activeSubtask = findSubtaskById(active.id as string, subtasks)
    }

    // If over subtask not found at current level, search deeper
    if (!overSubtask && over.id !== parentTaskId) {
      overSubtask = findSubtaskById(over.id as string, subtasks)
    }

    // If still not found, we can't proceed
    if (!activeSubtask) return

    // If over a subtask, check for circular references
    if (overSubtask && isDescendantOf(overSubtask, activeSubtask.id)) return

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Drag over event:', {
        activeId: active.id,
        overId: over.id,
        activeSubtask: activeSubtask?.title,
        overSubtask: overSubtask?.title,
        sameParent: activeSubtask.parentId === (overSubtask?.parentId || parentTaskId)
      })
    }
  }

  // Check if a subtask is a descendant of another subtask
  const isDescendantOf = (subtask: Subtask, potentialAncestorId: string): boolean => {
    // Base case: no subtasks
    if (!subtask.subtasks || subtask.subtasks.length === 0) return false

    // Check direct children first
    if (subtask.subtasks.some(child => child.id === potentialAncestorId)) {
      return true
    }

    // Recursively check all descendants
    return subtask.subtasks.some(child => isDescendantOf(child, potentialAncestorId))
  }

  // Find a subtask in the entire tree by ID
  const findSubtaskById = (id: string, tasks: Subtask[]): Subtask | null => {
    // First check at the current level
    const directMatch = tasks.find(task => task.id === id)
    if (directMatch) return directMatch

    // If not found, recursively search in all subtasks
    for (const task of tasks) {
      if (task.subtasks && task.subtasks.length > 0) {
        const found = findSubtaskById(id, task.subtasks)
        if (found) return found
      }
    }

    // Not found anywhere in the tree
    return null
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setIsDragging(false)
    setActiveSubtask(null)

    if (!over) return

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Drag end event:', { activeId: active.id, overId: over.id })
    }

    // If dragging over a different subtask
    if (active.id !== over.id) {
      // First try to find in current level
      let activeSubtask = subtasks.find(subtask => subtask.id === active.id)
      let overSubtask = subtasks.find(subtask => subtask.id === over.id)

      // If not found at current level, search the entire subtask tree
      if (!activeSubtask) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Active subtask not found at current level, searching nested subtasks...')
        }
        activeSubtask = findSubtaskById(active.id as string, subtasks)
      }

      if (!overSubtask && over.id !== parentTaskId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Over subtask not found at current level, searching nested subtasks...')
        }
        overSubtask = findSubtaskById(over.id as string, subtasks)
      }

      if (!activeSubtask) {
        console.error('Could not find active subtask:', active.id)
        return
      }

      try {
        // Show loading toast
        const loadingToast = toast({
          title: "Moving subtask",
          description: "Please wait...",
        })

        // Determine if this is a reordering within the same parent or a parent change
        const activeParentId = activeSubtask.parentId || parentTaskId
        const targetParentId = overSubtask ? overSubtask.parentId || parentTaskId : parentTaskId
        const isSameParentReorder = activeParentId === targetParentId

        console.log('Reordering details:', {
          activeSubtask: activeSubtask.title,
          activeParentId,
          overSubtask: overSubtask?.title || 'parent task',
          targetParentId,
          isSameParentReorder
        })

        if (process.env.NODE_ENV === 'development') {
          console.log('Moving subtask:', {
            activeSubtask: activeSubtask.title,
            activeParentId,
            overSubtask: overSubtask?.title || 'parent task',
            targetParentId,
            isSameParentReorder
          })
        }

        // If dropping onto another subtask in a different parent, make it a child of that subtask
        if (overSubtask && !isSameParentReorder) {
          try {
            await taskApi.reorderTask(
              activeSubtask.id,
              overSubtask.id,
              activeSubtask.parentId || parentTaskId
            )

            // Show success message
            toast({
              title: "Subtask moved",
              description: `"${activeSubtask.title}" is now a subtask of "${overSubtask.title}"`,
            })
          } catch (error) {
            console.error("Error moving subtask to another subtask:", error)
            throw error
          }
        }
        // If dropping onto the parent task area and it's a different parent
        else if (!overSubtask && !isSameParentReorder) {
          try {
            await taskApi.reorderTask(
              activeSubtask.id,
              parentTaskId,
              activeSubtask.parentId
            )

            // Show success message
            toast({
              title: "Subtask moved",
              description: `"${activeSubtask.title}" moved to parent task`,
            })
          } catch (error) {
            console.error("Error moving subtask to parent task:", error)
            throw error
          }
        }
        // If reordering within the same parent (either parent task or another subtask)
        else if (isSameParentReorder) {
          try {
            console.log('Calling reorderTask API for same-parent reordering with:', {
              taskId: activeSubtask.id,
              newParentId: null,
              oldParentId: activeSubtask.parentId || parentTaskId,
              targetTaskId: overSubtask ? overSubtask.id : null,
              isSameParentReorder: true
            });

            await taskApi.reorderTask(
              activeSubtask.id,
              null, // No parent change
              activeSubtask.parentId || parentTaskId, // Pass the current parent ID
              overSubtask ? overSubtask.id : null, // Target task ID for positioning
              true // Flag to indicate this is a same-parent reordering
            )

            // Show success message
            toast({
              title: "Subtask reordered",
              description: overSubtask
                ? `"${activeSubtask.title}" reordered relative to "${overSubtask.title}"`
                : `"${activeSubtask.title}" reordered"`
            })
          } catch (error) {
            console.error("Error reordering subtask:", error)
            throw error
          }
        }

        // Refresh the task list
        onSubtaskChange()
      } catch (error) {
        console.error("Error moving subtask:", error)

        // Extract error message if available
        let errorMessage = "Failed to move subtask. Please check the console for details.";
        let errorDetails = "";

        if (error instanceof Error) {
          try {
            const parsedError = JSON.parse(error.message);
            if (parsedError.message) {
              errorMessage = parsedError.message;

              // If there are more details in the error, add them
              if (parsedError.details && parsedError.details.stack) {
                const stackLines = parsedError.details.stack.split('\n');
                if (stackLines.length > 0) {
                  // Get the first line of the stack trace for more context
                  errorDetails = stackLines[0];
                }
              }
            }
          } catch (e) {
            // If parsing fails, use the original error message
            errorMessage = error.message || errorMessage;
          }
        }

        toast({
          title: "Error Moving Subtask",
          description: errorMessage + (errorDetails ? `\n${errorDetails}` : ""),
          variant: "destructive",
        })

        // Refresh the task list anyway to ensure UI is in sync with server state
        onSubtaskChange()
      }
    }
  }

  // Log the subtask structure for debugging
  const logSubtaskStructure = (tasks: Subtask[], level = 0) => {
    tasks.forEach(task => {
      console.log(
        `${'  '.repeat(level)}${task.title} ` +
        `(ID: ${task.id}, ` +
        `Parent: ${task.parentId || 'none'}, ` +
        `Status: ${task.status}, ` +
        `Nested: ${task.subtasks?.length || 0})`
      )
      if (task.subtasks && task.subtasks.length > 0) {
        logSubtaskStructure(task.subtasks, level + 1)
      }
    })
  }

  // Render the subtask list with drag and drop functionality
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Subtasks ({subtasks.length})</h3>
        {!isAddingSubtask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setIsAddingSubtask(true)
              // Only log in development mode
              if (process.env.NODE_ENV === 'development') {
                console.log('Current subtask structure:')
                logSubtaskStructure(subtasks)
              }
            }}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Subtask
          </Button>
        )}
      </div>

      {isAddingSubtask && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter subtask title..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSubtask()
              if (e.key === "Escape") {
                setIsAddingSubtask(false)
                setNewSubtaskTitle("")
              }
            }}
          />
          <Button
            size="sm"
            className="h-8 px-2"
            onClick={handleAddSubtask}
          >
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              setIsAddingSubtask(false)
              setNewSubtaskTitle("")
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ul className="space-y-2 mt-2">
          <SortableContext
            items={subtasks.map(subtask => subtask.id)}
            strategy={verticalListSortingStrategy}
          >
            {subtasks.map((subtask) => (
              <li key={subtask.id} className="space-y-2">
                <DraggableSubtask
                  subtask={subtask}
                  getUserInitials={getUserInitials}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteSubtask}
                  onAddNested={(id) => setAddingNestedToId(id)}
                />

                {/* Show form for adding nested subtask */}
                {addingNestedToId === subtask.id && (
                  <div className="pl-6 border-l-2 border-muted ml-3 mt-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter nested subtask title..."
                        value={nestedSubtaskTitle}
                        onChange={(e) => setNestedSubtaskTitle(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNestedSubtask(subtask.id);
                          } else if (e.key === 'Escape') {
                            setAddingNestedToId(null);
                            setNestedSubtaskTitle('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => handleAddNestedSubtask(subtask.id)}
                      >
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          setAddingNestedToId(null);
                          setNestedSubtaskTitle('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Render nested subtasks if they exist */}
                {subtask.subtasks && subtask.subtasks.length > 0 && (
                  <div className="pl-6 border-l-2 border-muted ml-3">
                    <DraggableSubtaskList
                      parentTaskId={subtask.id}
                      projectId={projectId}
                      subtasks={subtask.subtasks}
                      onSubtaskChange={onSubtaskChange}
                    />
                  </div>
                )}
              </li>
            ))}

            {subtasks.length === 0 && !isAddingSubtask && (
              <li className="text-sm text-muted-foreground text-center py-2">
                No subtasks yet. Add one to break down this task.
              </li>
            )}
          </SortableContext>
        </ul>

        {/* Drag overlay for visual feedback */}
        <DragOverlay>
          {activeSubtask && isDragging && (
            <div className="bg-background border border-primary rounded-md p-2 shadow-md opacity-80 w-full max-w-md">
              <div className="flex items-center gap-2">
                {activeSubtask.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-primary" />
                )}
                <span className="text-sm font-medium">{activeSubtask.title}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
