"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Task } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock } from "lucide-react"

interface Props {
  task: Task
  isActive: boolean
  isDragging?: boolean
}

export default function KanbanTask({ task, isActive, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Determine priority based on task description (for demo purposes)
  let priority = task.priority || "medium"
  if (!task.priority && task.description) {
    if (task.description.toLowerCase().includes("high")) {
      priority = "high"
    } else if (task.description.toLowerCase().includes("low")) {
      priority = "low"
    }
  }

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg p-4 shadow-sm border border-gray-200
        cursor-grab active:cursor-grabbing
        hover:shadow-md transition-all
        ${isActive ? "ring-2 ring-blue-500" : ""}
        transform-gpu
      `}
    >
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span
            className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${priorityColors[priority as keyof typeof priorityColors]}
            `}
          >
            {priority}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
            <Avatar className="h-6 w-6 border border-gray-200 shadow-sm">
              <AvatarImage src="/placeholder-user.jpg" alt="@user" />
              <AvatarFallback>{task.assignedTo?.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  )
}
