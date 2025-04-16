"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { Column, Task } from "@/types"
import KanbanTask from "./kanban-task"
import { Badge } from "@/components/ui/badge"
import { Plus, Check, X, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Props {
  column: Column
  tasks: Task[]
  activeTask: Task | null
  onAddTask: (columnId: string) => void
  onDeleteColumn: (columnId: string) => void
  onEditColumnTitle: (columnId: string, newTitle: string) => void
}

export default function KanbanColumn({
  column,
  tasks,
  activeTask,
  onAddTask,
  onDeleteColumn,
  onEditColumnTitle,
}: Props) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onEditColumnTitle(column.id, editTitle)
    }
    setIsEditing(false)
  }

  const columnColors = {
    pending: "bg-blue-500",
    "in-progress": "bg-yellow-500",
    completed: "bg-green-500",
  }

  const columnColor = columnColors[column.id as keyof typeof columnColors] || "bg-gray-500"

  return (
    <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg shadow-sm border-b border-gray-200 sticky top-0">
        <div className="flex-1 flex items-center min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full pr-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle()
                  if (e.key === "Escape") {
                    setIsEditing(false)
                    setEditTitle(column.title)
                  }
                }}
                className="flex-1 min-w-0 px-2 py-1 text-lg font-semibold bg-white border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="flex-shrink-0 p-1 hover:bg-green-100 rounded-full transition-colors"
              >
                <Check size={20} className="text-green-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded-full ${columnColor}`}></div>
              <h2 className="text-lg font-semibold text-gray-800 truncate">{column.title}</h2>
              <Badge variant="outline" className="ml-1 bg-gray-50">
                {tasks.length}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full transition-colors"
                onClick={() => setIsEditing(true)}
                title="Edit column"
              >
                <Pencil size={16} className="text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full transition-colors"
                onClick={() => onAddTask(column.id)}
                title="Add new task"
              >
                <Plus size={16} className="text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 hover:bg-red-100 rounded-full transition-colors"
                onClick={() => onDeleteColumn(column.id)}
                title="Delete column"
              >
                <X size={16} className="text-red-600" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div ref={setNodeRef} className="min-h-[200px] flex-1 rounded-lg transition-colors">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <KanbanTask key={task.id} task={task} isActive={activeTask?.id === task.id} />
            ))}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-20 border border-dashed rounded-lg border-muted-foreground/20">
                <p className="text-sm text-muted-foreground">No tasks</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
