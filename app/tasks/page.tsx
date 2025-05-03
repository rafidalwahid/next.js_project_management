"use client"

import { Plus, Search, List, Filter, Grid, ArrowDownAZ, Calendar, Flag, CircleDotDashed } from "lucide-react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TasksPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // State with URL params as defaults
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [priorityFilter, setPriorityFilter] = useState<string>(searchParams.get("priority") || "all")
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all")
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort") || "dueDate")
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    (searchParams.get("view") as "list" | "grid") || "list"
  )
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)

  const itemsPerPage = 12
  const { tasks: allTasks, isLoading, isError, mutate } = useTasks(1, 100) // Increased limit
  const { toast } = useToast()

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (priorityFilter !== "all") params.set("priority", priorityFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (sortBy !== "dueDate") params.set("sort", sortBy)
    if (viewMode !== "list") params.set("view", viewMode)
    if (currentPage !== 1) params.set("page", currentPage.toString())

    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : "/tasks", { scroll: false })
  }, [searchQuery, priorityFilter, statusFilter, sortBy, viewMode, currentPage, router])

  // Filter tasks by priority, status, and search query
  const filteredTasks = allTasks.filter((task: Task) => {
    const matchesPriority = priorityFilter === "all" || task.priority.toLowerCase() === priorityFilter.toLowerCase()
    const matchesStatus = statusFilter === "all" ||
      (task.status && task.status.name.toLowerCase() === statusFilter.toLowerCase())
    const matchesSearch = searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesPriority && matchesStatus && matchesSearch
  })

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title)
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] -
             priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder]
    } else if (sortBy === "dueDate") {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    return 0
  })

  // Calculate pagination
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const tasks = sortedTasks.slice(startIndex, startIndex + itemsPerPage)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(
    new Set(
      allTasks
        .filter(task => task.status)
        .map(task => task.status?.name)
    )
  )

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
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          <Button
            className="bg-black hover:bg-black/90 text-white w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* View mode toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "grid")} className="hidden md:block">
            <TabsList className="h-9">
              <TabsTrigger value="list" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="grid" className="px-3">
                <Grid className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Mobile filters button */}
          <DropdownMenu open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 md:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="p-2">
                <p className="text-xs font-medium mb-1">Priority</p>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-2">
                <p className="text-xs font-medium mb-1">Status</p>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status || ""}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-2">
                <p className="text-xs font-medium mb-1">Sort by</p>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop filters */}
          <div className="hidden md:flex items-center gap-2">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <Flag className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <CircleDotDashed className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status || ""}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[130px]">
                <ArrowDownAZ className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Task count */}
      <div className="text-sm text-muted-foreground">
        Showing {tasks.length} of {filteredTasks.length} tasks
      </div>

      {/* Task list */}
      <TaskList tasks={tasks} onDelete={deleteTask} />

      {/* Pagination */}
      {filteredTasks.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Create task modal */}
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
