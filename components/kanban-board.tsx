"use client"

import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string
  projectId: string
  assignedTo: string
  dueDate: string
  status: string
}

interface Column {
  title: string
  tasks: Task[]
}

interface KanbanBoardProps {
  columns: {
    [key: string]: Column
  }
}

export function KanbanBoard({ columns }: KanbanBoardProps) {
  return (
    <>
      {Object.entries(columns).map(([columnId, column]) => (
        <KanbanColumn key={columnId} id={columnId} title={column.title} tasks={column.tasks} />
      ))}
    </>
  )
}

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
}

function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  })

  const columnColors = {
    pending: "bg-blue-500",
    "in-progress": "bg-yellow-500",
    completed: "bg-green-500",
  }

  const columnColor = columnColors[id as keyof typeof columnColors] || "bg-gray-500"

  return (
    <div ref={setNodeRef} className="flex flex-col h-full">
      <div className="font-medium text-sm flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${columnColor}`}></div>
          {title}
          <Badge variant="outline" className="ml-2">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="bg-muted/40 rounded-lg p-4 flex-1 min-h-[500px] overflow-y-auto">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 border border-dashed rounded-lg border-muted-foreground/20">
            <p className="text-sm text-muted-foreground">No tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface DraggableTaskCardProps {
  task: Task
}

function DraggableTaskCard({ task }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const priorityColors = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    low: "bg-green-50 text-green-700 border-green-200",
  }

  // Determine priority based on task description (just for demo)
  let priority = "medium"
  if (task.description?.toLowerCase().includes("high")) {
    priority = "high"
  } else if (task.description?.toLowerCase().includes("low")) {
    priority = "low"
  }

  const priorityColor = priorityColors[priority as keyof typeof priorityColors]

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className="mb-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-3">
          <CardTitle className="text-sm flex justify-between">
            <span className="truncate">{task.title}</span>
            <Badge variant="outline" className={priorityColor}>
              {priority}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs truncate">{task.description}</CardDescription>
        </CardHeader>
        <CardFooter className="p-3 pt-0 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
          <Link href={`/tasks/edit/${task.id}`} onClick={(e) => e.stopPropagation()}>
            <Avatar className="h-6 w-6">
              <AvatarImage src="/placeholder-user.jpg" alt="@user" />
              <AvatarFallback>{task.assignedTo?.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
            </Avatar>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
