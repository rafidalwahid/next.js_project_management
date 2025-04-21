"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { taskApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Subtask {
  id: string
  title: string
  status: string
  priority: string
  assignedToId?: string | null
  assignedTo?: {
    id: string
    name: string | null
    image: string | null
  } | null
  subtasks?: Subtask[] // Add support for nested subtasks
}

interface SubtaskListProps {
  parentTaskId: string
  projectId: string
  subtasks: Subtask[]
  onSubtaskChange: () => void
}

export function SubtaskList({ parentTaskId, projectId, subtasks, onSubtaskChange }: SubtaskListProps) {
  const { toast } = useToast()
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [addingNestedToId, setAddingNestedToId] = useState<string | null>(null)
  const [nestedSubtaskTitle, setNestedSubtaskTitle] = useState("")

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
    if (!newSubtaskTitle.trim()) return

    try {
      console.log("Creating subtask with:", {
        title: newSubtaskTitle,
        projectId,
        parentId: parentTaskId,
        status: "pending",
        priority: "medium",
      })

      await taskApi.createTask({
        title: newSubtaskTitle,
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
        description: "Failed to add subtask. There may be an issue with the database schema. Please check the console for details.",
        variant: "destructive",
      })
    }
  }

  const handleAddNestedSubtask = async (parentSubtaskId: string) => {
    if (!nestedSubtaskTitle.trim()) return

    try {
      console.log("Creating nested subtask with:", {
        title: nestedSubtaskTitle,
        projectId,
        parentId: parentSubtaskId,
        status: "pending",
        priority: "medium",
      })

      await taskApi.createTask({
        title: nestedSubtaskTitle,
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
    try {
      await taskApi.deleteTask(subtaskId)
      onSubtaskChange()

      toast({
        title: "Subtask deleted",
        description: "Subtask has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subtask",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Subtasks ({subtasks.length})</h3>
        {!isAddingSubtask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsAddingSubtask(true)}
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

      <ul className="space-y-2 mt-2">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="space-y-2">
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded-md border",
                subtask.status === "completed" ? "bg-muted/50 border-muted" : "bg-card border-border"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleStatus(subtask.id, subtask.status)}
                  className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
                >
                  {subtask.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <span
                  className={cn(
                    "text-sm truncate",
                    subtask.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                  )}
                >
                  {subtask.title}
                </span>

                {subtask.priority && (
                  <Badge
                    variant={
                      subtask.priority === "high"
                        ? "destructive"
                        : subtask.priority === "low"
                          ? "secondary"
                          : "default"
                    }
                    className="text-[10px] px-1 py-0 h-4"
                  >
                    {subtask.priority}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {subtask.assignedTo && (
                  <Avatar className="h-6 w-6">
                    {subtask.assignedTo.image ? (
                      <AvatarImage src={subtask.assignedTo.image} alt={subtask.assignedTo.name || "User"} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getUserInitials(subtask.assignedTo.name)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                  title="Add nested subtask"
                  onClick={() => setAddingNestedToId(subtask.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
                <SubtaskList
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
      </ul>
    </div>
  )
}
