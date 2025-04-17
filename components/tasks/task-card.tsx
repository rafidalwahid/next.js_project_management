"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Edit, Trash, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    dueDate: string | null
    project?: {
      id: string
      title: string
    } | null
    assignedTo?: {
      id: string
      name: string | null
      image: string | null
    } | null
  }
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!task.assignedTo?.name) return "U"

    const nameParts = task.assignedTo.name.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    return nameParts[0].substring(0, 2).toUpperCase()
  }

  // Get status badge variant
  const getStatusBadgeVariant = () => {
    switch (task.status.toLowerCase()) {
      case "completed":
        return "success"
      case "in-progress":
        return "default"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Get priority badge variant
  const getPriorityBadgeVariant = () => {
    switch (task.priority.toLowerCase()) {
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

  // Format due date
  const formatDueDate = () => {
    if (!task.dueDate) return "No due date"
    
    const dueDate = new Date(task.dueDate)
    const isOverdue = dueDate < new Date()
    
    return (
      <span className={isOverdue ? "text-destructive" : ""}>
        {isOverdue ? "Overdue: " : ""}
        {formatDistanceToNow(dueDate, { addSuffix: true })}
      </span>
    )
  }

  return (
    <div
      className="relative rounded-lg border-0 bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/tasks/${task.id}`} className="group">
            <h3 className="font-medium group-hover:text-primary transition-colors text-base line-clamp-1">
              {task.title}
            </h3>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.id}`} className="cursor-pointer">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  View Task
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/tasks/edit/${task.id}`} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Task
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {task.description || "No description provided"}
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant()} className="capitalize">
              {task.status}
            </Badge>
            
            <Badge variant={getPriorityBadgeVariant()} className="capitalize">
              {task.priority} priority
            </Badge>

            {isHovered && (
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full"
                  asChild
                >
                  <Link href={`/tasks/${task.id}`}>
                    View Task
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {task.project && (
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertCircle className="mr-2 h-4 w-4" />
              <Link href={`/projects/${task.project.id}`} className="hover:underline">
                {task.project.title}
              </Link>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              {formatDueDate()}
            </div>
          )}

          {task.assignedTo && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Avatar className="h-6 w-6 border border-black/10">
                {task.assignedTo.image ? (
                  <AvatarImage src={task.assignedTo.image} alt={task.assignedTo.name || "User"} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {task.assignedTo.name || "Unnamed User"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
