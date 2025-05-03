"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, MoreHorizontal, Pencil, Trash, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Task, TaskAssignee } from "./task-context"
import { AssignMembersPopup } from "./assign-members-popup"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  dragHandleProps?: any
  onToggleComplete: (taskId: string) => void
  onEdit?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onUpdateAssignees: (taskId: string, assigneeIds: string[]) => void
}

export function TaskCard({
  task,
  isDragging = false,
  dragHandleProps = {},
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateAssignees
}: TaskCardProps) {
  // Force re-render when task changes
  const [, forceUpdate] = useState({});

  // Update the component when the task changes
  useEffect(() => {
    forceUpdate({});
  }, [task.dueDate, task.startDate, task.endDate]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Calculate days remaining or overdue
  const getDueDateStatus = (dueDate?: string | null) => {
    if (!dueDate) return null;

    // Log the due date for debugging
    console.log("Calculating due date status for:", dueDate);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);

      // Log the parsed date for debugging
      console.log("Parsed due date:", due);

      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Log the calculated difference for debugging
      console.log("Calculated difference in days:", diffDays);

      if (diffDays < 0) {
        return `${Math.abs(diffDays)} days overdue`;
      } else if (diffDays === 0) {
        return "Due today";
      } else if (diffDays === 1) {
        return "Due tomorrow";
      } else {
        return `${diffDays} days remaining`;
      }
    } catch (error) {
      console.error("Error calculating due date status:", error);
      return "Invalid date";
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div
      className={cn(
        "bg-background p-3 rounded-md shadow-sm border-l-4 flex flex-col gap-2",
        "transition-all duration-200 hover:shadow-md",
        task.completed ? "opacity-70" : "",
        isDragging ? "shadow-lg ring-2 ring-primary ring-opacity-50" : ""
      )}
      style={{
        borderLeftColor: task.status?.color || "#6E56CF"
      }}
    >
      {/* Header with title and actions */}
      <div className="flex justify-between items-start gap-1 sm:gap-2">
        <div className="flex items-start gap-1 sm:gap-2 min-w-0 flex-1">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="mt-1 flex-shrink-0"
            aria-label={`Mark task "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
          />
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "font-medium text-sm leading-tight break-words",
              task.completed ? "line-through text-muted-foreground" : ""
            )}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <TaskCardMenu
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      </div>

      {/* Task metadata */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {task.priority && (
          <Badge variant="outline" className={cn("text-xs py-0 h-5", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
        )}

        {task.dueDate && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs py-0 h-5">
            <Calendar className="h-3 w-3" />
            <span className="whitespace-nowrap">{getDueDateStatus(task.dueDate)}</span>
          </Badge>
        )}
      </div>

      {/* Footer with assignees */}
      <div className="flex justify-end mt-auto pt-2">
        <AssigneeAvatars
          assignees={task.assignees || []}
          maxDisplay={3}
          onUpdateAssignees={(assigneeIds) => onUpdateAssignees(task.id, assigneeIds)}
        />
      </div>
    </div>
  );
}

// Task card dropdown menu
function TaskCardMenu({
  task,
  onEdit,
  onDelete,
  onToggleComplete
}: {
  task: Task;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(task.id)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onToggleComplete(task.id)}>
          <Check className="mr-2 h-4 w-4" />
          Mark as {task.completed ? "Incomplete" : "Complete"}
        </DropdownMenuItem>
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Consistent assignee avatars component
interface AssigneeAvatarsProps {
  assignees: TaskAssignee[];
  maxDisplay?: number;
  onUpdateAssignees: (assigneeIds: string[]) => void;
}

export function AssigneeAvatars({
  assignees,
  maxDisplay = 3,
  onUpdateAssignees
}: AssigneeAvatarsProps) {
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {assignees.slice(0, maxDisplay).map((assignee) => (
          <Avatar
            key={assignee.id}
            className="h-7 w-7 border border-black"
          >
            <AvatarImage
              src={assignee.user.image || undefined}
              alt={assignee.user.name || "Team member"}
            />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {assignee.user.name?.substring(0, 2) || assignee.user.email.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
        ))}

        {assignees.length > maxDisplay && (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border border-black">
            +{assignees.length - maxDisplay}
          </div>
        )}
      </div>

      {/* Use the AssignMembersPopup component directly */}
      <AssignMembersPopup
        open={isAssignPopupOpen}
        onOpenChange={setIsAssignPopupOpen}
        selectedUserIds={assignees.map(a => a.user.id)}
        onAssign={onUpdateAssignees}
      />
    </div>
  );
}
