"use client"

import Link from "next/link"
import { Filter, Plus, Search, LayoutGrid, List, CheckSquare } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskGrid } from "@/components/tasks/task-grid"
import { TaskList } from "@/components/tasks/task-list"
import { Pagination } from "@/components/tasks/pagination"
import { useTasks } from "@/hooks/use-data"
import { taskApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const { tasks: allTasks, isLoading, isError, mutate } = useTasks(1, 100) // Increased limit
  const { toast } = useToast()

  // Filter tasks by priority and search query
  const filteredTasks = allTasks.filter(task => {
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
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-destructive">Error loading tasks. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-background sticky top-0 z-10 py-2">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          <Link href="/tasks/new">
            <Button className="bg-black hover:bg-black/90 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-2">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{allTasks.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All tasks in your organization</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>High Priority</CardDescription>
            <CardTitle className="text-3xl">
              {allTasks.filter(t => t.priority.toLowerCase() === 'high').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Tasks with high priority</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Medium Priority</CardDescription>
            <CardTitle className="text-3xl">
              {allTasks.filter(t => t.priority.toLowerCase() === 'medium').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Tasks with medium priority</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Low Priority</CardDescription>
            <CardTitle className="text-3xl">
              {allTasks.filter(t => t.priority.toLowerCase() === 'low').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Tasks with low priority</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-0">
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Directory</CardTitle>
              <CardDescription>
                View and manage all tasks in your organization.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              {priorityFilter !== 'all' && ` with priority: ${priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}`}
              {searchQuery && ` matching: "${searchQuery}"`}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-muted/30 p-4 rounded-lg">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  className="pl-8 bg-background"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            <Tabs defaultValue={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2 md:w-[160px] bg-background/80">
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-6">
            {viewMode === "grid" ? (
              <TaskGrid tasks={tasks} onDelete={deleteTask} />
            ) : (
              <TaskList tasks={tasks} onDelete={deleteTask} />
            )}

            {filteredTasks.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
