"use client"

import Link from "next/link"
import { Edit, Trash, MoreHorizontal, CheckCircle2 } from "lucide-react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Task {
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

interface TaskListProps {
  tasks: Task[]
  onDelete: (taskId: string) => void
}

export function TaskList({ tasks, onDelete }: TaskListProps) {
  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return "U"

    const nameParts = name.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    return name.substring(0, 2).toUpperCase()
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
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
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
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

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No tasks found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border-0 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Link
                  href={`/tasks/${task.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {task.title}
                </Link>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {task.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                {task.project ? (
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="text-sm hover:underline"
                  >
                    {task.project.title}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(task.status)} className="capitalize">
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize">
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.dueDate ? (
                  <span className="text-sm">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-black/10">
                      {task.assignedTo.image ? (
                        <AvatarImage src={task.assignedTo.image} alt={task.assignedTo.name || "User"} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getUserInitials(task.assignedTo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignedTo.name || "Unnamed User"}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
