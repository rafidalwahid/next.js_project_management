"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Settings, Calendar, Clock, Users, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KanbanBoard } from "@/components/project/kanban-board"
import { StatusListView } from "@/components/project/status-list-view"
import { TaskFilter, TaskFilters } from "@/components/project/task-filter"
import { ProjectSettingsDialog } from "@/components/project/project-settings-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskForm } from "@/components/project/task-form"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  startDate?: string | null
  endDate?: string | null
  dueDate?: string | null
  timeSpent?: number | null
  estimatedTime?: number | null
  projectId: string
  statusId?: string | null
  parentId?: string | null
  order: number
  completed: boolean
  createdAt: string
  updatedAt: string
  assignees?: {
    id: string
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }[]
  status?: {
    id: string
    name: string
    color: string
  } | null
}

interface ProjectStatus {
  id: string
  name: string
  color: string
  description?: string | null
  order: number
  isDefault: boolean
  projectId: string
}

interface Project {
  id: string
  title: string
  description: string | null
  startDate: string | null
  endDate: string | null
  dueDate: string | null
  totalTimeSpent: number | null
  estimatedTime: number | null
  createdAt: string
  updatedAt: string
  statuses: ProjectStatus[]
  _count?: {
    tasks: number
    teamMembers: number
  }
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTasksLoading, setIsTasksLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("board")
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({
    search: "",
    statusIds: [],
    assigneeIds: [],
    priority: null,
    completed: null,
  })
  const [users, setUsers] = useState<any[]>([])
  const { toast } = useToast()

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/projects/${projectId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch project")
        }

        const data = await response.json()
        setProject(data.project)
        setStatuses(data.project.statuses || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch project details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  // Fetch tasks data
  const fetchTasks = async () => {
    try {
      setIsTasksLoading(true)
      const response = await fetch(`/api/tasks?projectId=${projectId}&limit=100`)

      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      })
    } finally {
      setIsTasksLoading(false)
    }
  }

  // Load tasks on component mount and when project changes
  useEffect(() => {
    if (projectId) {
      fetchTasks()
      fetchUsers()
    }
  }, [projectId])

  // Fetch users for the project
  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/team`)

      if (!response.ok) {
        throw new Error("Failed to fetch project members")
      }

      const data = await response.json()

      // Check if we have team members data
      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        // Extract user data from team members
        const usersList = data.teamMembers.map(member => member.user).filter(Boolean)
        console.log("Fetched users:", usersList.length)
        setUsers(usersList)
      } else {
        console.error("No team members data found:", data)
        setUsers([])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  // Filter tasks based on current filters
  useEffect(() => {
    if (tasks.length === 0) {
      setFilteredTasks([])
      return
    }

    let filtered = [...tasks]

    // Filter by search term
    if (taskFilters.search) {
      const searchTerm = taskFilters.search.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
      )
    }

    // Filter by status
    if (taskFilters.statusIds.length > 0) {
      filtered = filtered.filter(task =>
        task.statusId && taskFilters.statusIds.includes(task.statusId)
      )
    }

    // Filter by assignee
    if (taskFilters.assigneeIds.length > 0) {
      filtered = filtered.filter(task =>
        task.assignees && task.assignees.some(assignee =>
          taskFilters.assigneeIds.includes(assignee.user.id)
        )
      )
    }

    // Filter by priority
    if (taskFilters.priority) {
      filtered = filtered.filter(task =>
        task.priority.toLowerCase() === taskFilters.priority?.toLowerCase()
      )
    }

    // Filter by completion status
    if (taskFilters.completed !== null) {
      filtered = filtered.filter(task => task.completed === taskFilters.completed)
    }

    setFilteredTasks(filtered)
  }, [tasks, taskFilters])

  const handleCreateTask = () => {
    setEditingTaskId(null)
    setIsTaskDialogOpen(true)
  }

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId)
    setIsTaskDialogOpen(true)
  }

  const handleTaskDialogClose = async () => {
    setIsTaskDialogOpen(false)
    setEditingTaskId(null)
    // Refresh tasks after creating or editing
    await fetchTasks()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    return format(new Date(dateString), "MMM d, yyyy")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <p className="text-muted-foreground mt-2">The project you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Edit Project"
                onClick={() => setIsSettingsDialogOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateTask}>
              <span className="mr-2">+</span> New Task
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {project._count?.tasks ?
                      Math.round((tasks.filter(t => t.completed).length / project._count.tasks) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: project._count?.tasks ?
                        `${Math.round((tasks.filter(t => t.completed).length / project._count.tasks) * 100)}%` : "0%"
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {tasks.filter(t => t.completed).length} / {project._count?.tasks || 0} tasks
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Timeline</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Time Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    {project.totalTimeSpent || 0} / {project.estimatedTime || 0} hours
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Team</p>
                  <p className="text-xs text-muted-foreground">
                    {project._count?.teamMembers || 0} members
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <TaskFilter
          statuses={statuses}
          users={users}
          onFilterChange={setTaskFilters}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <KanbanBoard
            projectId={projectId}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
            initialTasks={filteredTasks.length > 0 || Object.values(taskFilters).some(v =>
              Array.isArray(v) ? v.length > 0 : v !== null && v !== ""
            ) ? filteredTasks : tasks}
            initialStatuses={statuses}
            onTasksChange={setTasks}
            onStatusesChange={setStatuses}
            onRefresh={fetchTasks}
          />
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Tasks by Status</h2>
                <p className="text-sm text-muted-foreground">
                  View and manage tasks grouped by status
                </p>
              </div>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </div>
            <StatusListView
              projectId={projectId}
              statuses={statuses}
              tasks={filteredTasks.length > 0 || Object.values(taskFilters).some(v =>
                Array.isArray(v) ? v.length > 0 : v !== null && v !== ""
              ) ? filteredTasks : tasks}
              isLoading={isTasksLoading}
              onEditTask={handleEditTask}
              onRefresh={fetchTasks}
            />
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                People working on this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Team view will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Project Analytics</CardTitle>
              <CardDescription>
                Track project progress and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-3xl" style={{ zIndex: 100 }}>
          <DialogHeader>
            <DialogTitle>{editingTaskId ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            taskId={editingTaskId || undefined}
            onSuccess={handleTaskDialogClose}
            onCancel={handleTaskDialogClose}
          />
        </DialogContent>
      </Dialog>

      {/* Project Settings Dialog */}
      {project && (
        <ProjectSettingsDialog
          projectId={projectId}
          open={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          project={project}
          statuses={statuses}
          onSuccess={async () => {
            await fetchProject();
            await fetchTasks();
          }}
        />
      )}
    </div>
  )
}
