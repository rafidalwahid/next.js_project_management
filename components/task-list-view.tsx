"use client"

import type { Column, Task } from "@/types"
import { ChevronRight, Plus, Check, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  columns: Column[]
  onAddTask: (columnId: string, task: Partial<Task>) => void
}

interface NewTask {
  columnId: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
}

export default function TaskListView({ columns, onAddTask }: Props) {
  const [newTask, setNewTask] = useState<NewTask | null>(null)

  const startNewTask = (columnId: string) => {
    setNewTask({
      columnId,
      title: "",
      description: "",
      priority: "medium",
    })
  }

  const handleNewTaskSubmit = () => {
    if (!newTask || !newTask.title.trim()) return

    onAddTask(newTask.columnId, {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
    })

    setNewTask(null)
  }

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      {columns.map((column) => (
        <div key={column.id} className="border-b last:border-b-0">
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">{column.title}</h2>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => startNewTask(column.id)}
            >
              <Plus size={16} />
              Add Task
            </Button>
          </div>
          <div className="divide-y">
            {newTask?.columnId === column.id && (
              <div className="px-6 py-4 bg-blue-50">
                <div className="flex items-start gap-4">
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-2" />
                  <div className="flex-1 space-y-3">
                    <Input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Task title"
                      className="w-full"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleNewTaskSubmit()
                        }
                        if (e.key === "Escape") {
                          setNewTask(null)
                        }
                      }}
                    />
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Task description"
                      className="w-full"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          e.preventDefault()
                          handleNewTaskSubmit()
                        }
                        if (e.key === "Escape") {
                          setNewTask(null)
                        }
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <Select
                        value={newTask.priority}
                        onValueChange={(value) =>
                          setNewTask({ ...newTask, priority: value as "low" | "medium" | "high" })
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button onClick={handleNewTaskSubmit} className="flex items-center gap-1">
                          <Check size={16} />
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setNewTask(null)} className="flex items-center gap-1">
                          <X size={16} />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {column.tasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                  <span
                    className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${
                        task.priority === "high"
                          ? priorityColors.high
                          : task.priority === "low"
                            ? priorityColors.low
                            : priorityColors.medium
                      }
                    `}
                  >
                    {task.priority || "medium"}
                  </span>
                </div>
              </div>
            ))}
            {column.tasks.length === 0 && !newTask && (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>No tasks in this column</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
