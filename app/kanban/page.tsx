"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart3, Filter, Plus, Search, LayoutList, KanbanSquare } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import KanbanColumn from "@/components/kanban-column"
import KanbanTask from "@/components/kanban-task"
import TaskListView from "@/components/task-list-view"
import { useProjects, useTasks } from "@/hooks/use-data"
import { taskApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Column } from "@/types"

interface Task {
  id: string
  title: string
  description: string
  projectId: string
  assignedTo: string
  dueDate: string
  status: string
  priority?: string
}

export default function KanbanPage() {
  const { projects } = useProjects(1, 100)
  const { tasks, mutate } = useTasks(1, 100)
  const { toast } = useToast()
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [filteredTasks, setFilteredTasks] = useState(tasks)
  const [columns, setColumns] = useState<Column[]>([
    { id: "pending", title: "To Do", tasks: [] },
    { id: "in-progress", title: "In Progress", tasks: [] },
    { id: "completed", title: "Done", tasks: [] },
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Filter tasks based on selected project and search query
  useEffect(() => {
    let filtered = tasks

    if (selectedProject !== "all") {
      filtered = filtered.filter((task) => task.projectId === selectedProject)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) => task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query),
      )
    }

    setFilteredTasks(filtered)
  }, [tasks, selectedProject, searchQuery])

  // Organize tasks into columns
  useEffect(() => {
    const newColumns = [...columns]

    // Reset tasks in each column
    newColumns.forEach((column) => {
      column.tasks = []
    })

    // Distribute tasks to columns
    filteredTasks.forEach((task) => {
      const columnIndex = newColumns.findIndex((col) => col.id === task.status)
      if (columnIndex !== -1) {
        newColumns[columnIndex].tasks.push(task)
      } else {
        // If status doesn't match any column, put in first column
        newColumns[0].tasks.push(task)
      }
    })

    setColumns(newColumns)
  }, [filteredTasks])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = filteredTasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the source and destination columns
    const activeColumnIndex = columns.findIndex((col) => col.tasks.some((task) => task.id === activeId))
    const overColumnIndex = columns.findIndex(
      (col) => col.id === overId || col.tasks.some((task) => task.id === overId),
    )

    if (activeColumnIndex === -1 || overColumnIndex === -1 || activeColumnIndex === overColumnIndex) return

    // Update columns state for visual feedback during drag
    setColumns((prev) => {
      const newColumns = [...prev]
      const activeColumn = newColumns[activeColumnIndex]
      const overColumn = newColumns[overColumnIndex]

      // Find the task and remove it from the source column
      const taskIndex = activeColumn.tasks.findIndex((task) => task.id === activeId)
      if (taskIndex === -1) return prev

      const [task] = activeColumn.tasks.splice(taskIndex, 1)

      // Add the task to the destination column
      overColumn.tasks.push(task)

      return newColumns
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the destination column
    const overColumnIndex = columns.findIndex(
      (col) => col.id === overId || col.tasks.some((task) => task.id === overId),
    )
    if (overColumnIndex === -1) return

    const overColumn = columns[overColumnIndex]
    const task = tasks.find((t) => t.id === activeId)

    if (task) {
      try {
        // Update task status in the database
        await taskApi.updateTask(activeId, { status: overColumn.id })
        mutate() // Refresh the data
        toast({
          title: "Task updated",
          description: `Task moved to ${overColumn.title}`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update task status",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddTask = async (columnId: string, taskData: Partial<Task> = {}) => {
    // Generate default task data
    const newTask = {
      title: taskData.title || "New Task",
      description: taskData.description || "Click to edit",
      projectId: selectedProject !== "all" ? selectedProject : projects[0]?.id || "",
      assignedToId: null,
      dueDate: new Date().toISOString(),
      status: columnId,
      priority: taskData.priority || "medium",
    }

    try {
      // Add the task
      await taskApi.createTask(newTask)
      mutate() // Refresh the data
      toast({
        title: "Task created",
        description: "New task has been created",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    // Don't delete default columns
    if (["pending", "in-progress", "completed"].includes(columnId)) {
      toast({
        title: "Cannot delete column",
        description: "Default columns cannot be deleted",
        variant: "destructive",
      })
      return
    }

    // Move tasks to the first column
    const columnToDelete = columns.find((col) => col.id === columnId)
    if (columnToDelete && columnToDelete.tasks.length > 0) {
      try {
        // Update all tasks in this column to pending status
        const updatePromises = columnToDelete.tasks.map(task =>
          taskApi.updateTask(task.id, { status: "pending" })
        )
        await Promise.all(updatePromises)
        mutate() // Refresh the data
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update tasks",
          variant: "destructive",
        })
        return
      }
    }

    // Remove the column
    setColumns((prev) => prev.filter((col) => col.id !== columnId))

    toast({
      title: "Column deleted",
      description: "The column has been removed",
    })
  }

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return

    const newColumnId = newColumnTitle.toLowerCase().replace(/\s+/g, "-")

    // Check if column with this ID already exists
    if (columns.some((col) => col.id === newColumnId)) {
      alert("A column with a similar name already exists")
      return
    }

    const newColumn: Column = {
      id: newColumnId,
      title: newColumnTitle.trim(),
      tasks: [],
    }

    setColumns((prev) => [...prev, newColumn])
    setNewColumnTitle("")
    setIsAddingColumn(false)
  }

  const handleEditColumnTitle = (columnId: string, newTitle: string) => {
    setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, title: newTitle } : col)))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <BarChart3 className="h-6 w-6" />
            <span>ProjectPro</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/projects" className="text-sm font-medium transition-colors hover:text-primary">
              Projects
            </Link>
            <Link href="/tasks" className="text-sm font-medium transition-colors hover:text-primary">
              Tasks
            </Link>
            <Link href="/kanban" className="text-sm font-medium text-primary">
              Kanban
            </Link>
            <Link href="/team" className="text-sm font-medium transition-colors hover:text-primary">
              Team
            </Link>
            <Link href="/resources" className="text-sm font-medium transition-colors hover:text-primary">
              Resources
            </Link>
          </nav>
          <UserNav />
        </div>
      </header>
      <div className="grid flex-1 md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r bg-muted/40 md:block">
          <DashboardNav />
        </aside>
        <main className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")}>
                {viewMode === "kanban" ? (
                  <>
                    <LayoutList className="mr-2 h-4 w-4" />
                    List View
                  </>
                ) : (
                  <>
                    <KanbanSquare className="mr-2 h-4 w-4" />
                    Kanban View
                  </>
                )}
              </Button>
              <Link href="/tasks/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {viewMode === "kanban" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 overflow-x-auto pb-4">
                {columns.map((column) => {
                  // Define gradient colors based on column type
                  let gradientClass = "from-gray-50 to-gray-100"
                  if (column.id === "pending") gradientClass = "from-blue-50 to-blue-100/30"
                  if (column.id === "in-progress") gradientClass = "from-yellow-50 to-yellow-100/30"
                  if (column.id === "completed") gradientClass = "from-green-50 to-green-100/30"

                  return (
                    <div key={column.id} className="flex-shrink-0 w-80">
                      <div className={`rounded-lg bg-gradient-to-b ${gradientClass} shadow-md`}>
                        <KanbanColumn
                          column={column}
                          tasks={column.tasks}
                          activeTask={activeTask}
                          onAddTask={handleAddTask}
                          onDeleteColumn={handleDeleteColumn}
                          onEditColumnTitle={handleEditColumnTitle}
                        />
                      </div>
                    </div>
                  )
                })}

                {/* Add Column Button or Form */}
                <div className="flex-shrink-0 w-80">
                  {isAddingColumn ? (
                    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                      <Input
                        type="text"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="Enter column title"
                        className="w-full"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddColumn()
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <Button onClick={handleAddColumn}>Add</Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddingColumn(false)
                            setNewColumnTitle("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingColumn(true)}
                      className="w-full h-[100px] flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <Plus size={24} className="text-gray-600" />
                      <span className="ml-2 text-gray-600 font-medium">Add Column</span>
                    </button>
                  )}
                </div>
              </div>
              <DragOverlay>
                {activeTask ? <KanbanTask task={activeTask} isActive={true} isDragging={true} /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <TaskListView columns={columns} onAddTask={handleAddTask} />
          )}
        </main>
      </div>
    </div>
  )
}
