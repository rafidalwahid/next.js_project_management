"use client"

import Link from "next/link"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

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
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Tasks assigned to the user</CardDescription>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tasks</h2>
        <Link href="/tasks" className="text-sm text-primary hover:underline">
          View All Tasks
        </Link>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Assigned Tasks</h3>
          <p className="text-sm text-muted-foreground">Tasks currently assigned to this user</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col space-y-2 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {task.title}
                    </Link>
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
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Link
                      href={`/projects/${task.project.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {task.project.title}
                    </Link>
                  </div>
                </div>
                {task.dueDate && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>Due {formatDate(task.dueDate)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
