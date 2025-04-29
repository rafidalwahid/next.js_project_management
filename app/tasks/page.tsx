"use client"

import { Plus, Search, List } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskList } from "@/components/tasks/task-list"
import { Pagination } from "@/components/tasks/pagination"
import { useTasks } from "@/hooks/use-data"
import { taskApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Task } from "@/components/tasks/task-list"
import { TaskCreateModal } from "@/components/modals/task-create-modal"

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const itemsPerPage = 12
  const { tasks: allTasks, isLoading, isError, mutate } = useTasks(1, 100) // Increased limit
  const { toast } = useToast()

  // Filter tasks by priority and search query
  const filteredTasks = allTasks.filter((task: Task) => {
    const matchesPriority = priorityFilter === "all" || task.priority.toLowerCase() === priorityFilter.toLowerCase()
    const matchesSearch = searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesPriority && matchesSearch
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const tasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const deleteTask = async (id: string) => {
    try {
      await taskApi.deleteTask(id)
      mutate() // Refresh the data
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the task",
        variant: "destructive",
      })
    }
  }

  // Show loading state when loading data
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-destructive">Error loading tasks. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight mb-2 sm:mb-0">Tasks</h1>
        <div className="flex items-center gap-2">
          <Button 
            className="bg-black hover:bg-black/90 text-white"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <TaskList tasks={tasks} onDelete={deleteTask} />

      {filteredTasks.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
      
      <TaskCreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          mutate() // Refresh the tasks list after creating a new task
        }}
      />
    </div>
  )
}
