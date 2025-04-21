"use client"

import Link from "next/link"
import { Calendar, Clock, MoreHorizontal, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  project: {
    id: string
    title: string
  }
}

interface UserProfileTasksProps {
  tasks: Task[]
}

export function UserProfileTasks({ tasks }: UserProfileTasksProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Tasks assigned to the user</CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <h3 className="text-lg font-medium">No Tasks</h3>
              <p className="text-sm text-muted-foreground">
                This user does not have any tasks assigned.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Tasks assigned to the user</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/tasks">
                View All
              </Link>
            </Button>
            <Button size="sm" variant="default" asChild>
              <Link href="/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="overflow-hidden border bg-background">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "success"
                          : task.status === "in-progress"
                          ? "default"
                          : task.status === "pending"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {task.status}
                    </Badge>
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "destructive"
                          : task.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Link href={`/tasks/${task.id}`} className="w-full">
                          View Task
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href={`/tasks/${task.id}/edit`} className="w-full">
                          Edit Task
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="mt-2 text-lg">
                  <Link href={`/tasks/${task.id}`} className="hover:text-primary">
                    {task.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <Link href={`/projects/${task.project.id}`} className="hover:text-primary hover:underline">
                      {task.project.title}
                    </Link>
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Due {formatDate(task.dueDate)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
