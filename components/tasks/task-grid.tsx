"use client"

import { CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"

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

interface TaskGridProps {
  tasks: Task[]
  onDelete: (taskId: string) => void
}

export function TaskGrid({ tasks, onDelete }: TaskGridProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <CheckSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Tasks Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            No tasks match your current search criteria or filters. Try adjusting your search terms or filter settings.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onDelete={onDelete} />
      ))}
    </div>
  )
}
