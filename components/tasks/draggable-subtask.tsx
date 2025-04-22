"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CheckCircle2, Circle, GripVertical, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Subtask } from "@/types/task"

interface DraggableSubtaskProps {
  subtask: Subtask
  getUserInitials: (name: string | null) => string
  onToggleStatus: (id: string, isCompleted: boolean) => void
  onDelete: (id: string) => void
  onAddNested: (id: string) => void
}

export function DraggableSubtask({
  subtask,
  getUserInitials,
  onToggleStatus,
  onDelete,
  onAddNested,
}: DraggableSubtaskProps) {
  // Only log in development mode and when explicitly enabled
  const DEBUG = false;
  if (DEBUG && process.env.NODE_ENV === 'development') {
    console.log(`Rendering DraggableSubtask: ${subtask.title} (ID: ${subtask.id}, Parent: ${subtask.parentId || 'none'})`,
      subtask.subtasks ? `with ${subtask.subtasks.length} nested subtasks` : 'with no nested subtasks');
  }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subtask.id,
    data: {
      type: "subtask",
      subtask,
      parentId: subtask.parentId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 rounded-md border bg-card border-border"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <button
          onClick={() => onToggleStatus(subtask.id, false)}
          className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
        >
          <Circle className="h-5 w-5" />
        </button>

        <span className="text-sm truncate text-foreground">
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
          onClick={() => onAddNested(subtask.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(subtask.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
