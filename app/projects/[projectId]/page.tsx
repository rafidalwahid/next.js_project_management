"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Settings, Calendar, Clock, Users, BarChart2, UserPlus, Trash2, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { KanbanBoard } from "@/components/project/kanban-board"
import { StatusListView } from "@/components/project/status-list-view"
import { TaskProvider } from "@/components/project/task-context"
import { TaskFilterNew } from "@/components/project/task-filter"
import { TaskFilters } from "@/components/project/task-context"
import { ProjectSettingsDialog } from "@/components/project/project-settings-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskForm } from "@/components/project/task-form"
import { AddTeamMemberDialog } from "@/components/project/add-team-member-dialog"
import { format } from "date-fns"
import { CreateStatusDialogNew } from "@/components/project/create-status-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  createdBy?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
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
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
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
  const [userToRemove, setUserToRemove] = useState<any>(null)
  const [isRemovingUser, setIsRemovingUser] = useState(false)
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

  const handleRemoveTeamMember = async () => {
    if (!userToRemove) return

    try {
      setIsRemovingUser(true)
      const response = await fetch(`/api/projects/${projectId}/team/${userToRemove.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove team member")
      }

      toast({
        title: "Team member removed",
        description: `${userToRemove.name || userToRemove.email} has been removed from the project team`,
      })

      // Refresh the team members list
      await fetchUsers()
    } catch (error: any) {
      console.error("Error removing team member:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
      })
    } finally {
      setIsRemovingUser(false)
      setUserToRemove(null)
    }
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
    <div>
      <div className="flex flex-col gap-4">

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
                {project.title}
              </h1>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-shrink-0 rounded-full"
                title="Edit Project"
                onClick={() => setIsSettingsDialogOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            {project.description && (
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="bg-muted/10 p-4 rounded-lg mb-6">
        <TaskProvider projectId={projectId}>
          <TaskFilterNew />
        </TaskProvider>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList className="w-full sm:w-auto bg-background">
            <TabsTrigger value="board" className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Board</TabsTrigger>
            <TabsTrigger value="list" className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">List</TabsTrigger>
            <TabsTrigger value="team" className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Team</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analytics</TabsTrigger>
          </TabsList>
          {activeTab === "board" && (
            <TaskProvider projectId={projectId}>
              <CreateStatusDialogNew
                projectId={projectId}
              />
            </TaskProvider>
          )}
        </div>
        <TabsContent value="board">
          <div className="space-y-4">
            <TaskProvider projectId={projectId}>
              <KanbanBoard
                projectId={projectId}
                onEditTask={handleEditTask}
              />
            </TaskProvider>
          </div>
        </TabsContent>
        <TabsContent value="list">
          <div className="space-y-4">
            <TaskProvider projectId={projectId}>
              <StatusListView
                projectId={projectId}
                onEditTask={handleEditTask}
              />
            </TaskProvider>
          </div>
        </TabsContent>
        <TabsContent value="team">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Project Creator Card */}
            <Card>
              <CardHeader>
                <CardTitle>Project Creator</CardTitle>
                <CardDescription>
                  The person who created this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border border-black flex-shrink-0">
                    {project.createdBy?.image ? (
                      <AvatarImage src={project.createdBy.image} alt={project.createdBy.name || ""} />
                    ) : (
                      <AvatarFallback>
                        {project.createdBy?.name ? project.createdBy.name.charAt(0) : "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{project.createdBy?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground truncate">{project.createdBy?.email || ""}</p>
                    {users.some(user => user.id === project.createdBy?.id) && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Also a team member
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members Card */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  People working on this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {project.createdBy && users.some(user => user.id === project.createdBy?.id)
                      ? (project._count?.teamMembers || 0) - 1
                      : (project._count?.teamMembers || 0)} other members assigned to this project
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTeamDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Members
                    </Button>
                  </div>
                </div>

                {users.length > 0 ? (
                  <div className="space-y-4">
                    {users
                      .filter(user => user.id !== project.createdBy?.id)
                      .slice(0, 5)
                      .map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-8 w-8 border border-black flex-shrink-0">
                            {user.image ? (
                              <AvatarImage src={user.image} alt={user.name || ""} />
                            ) : (
                              <AvatarFallback>
                                {user.name ? user.name.charAt(0) : "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{user.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        {/* Don't show remove button for project creator */}
                        {user.id !== project.createdBy?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
                            onClick={() => setUserToRemove(user)}
                            title="Remove from team"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {users.filter(user => user.id !== project.createdBy?.id).length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        + {users.filter(user => user.id !== project.createdBy?.id).length - 5} more members
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {project.createdBy && users.some(user => user.id === project.createdBy?.id)
                      ? "No additional team members found for this project."
                      : "No team members found for this project."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>
                  Overall completion status of tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {project._count?.tasks ?
                        Math.round((tasks.filter(t => t.status?.isCompletedStatus).length / project._count.tasks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: project._count?.tasks ?
                          `${Math.round((tasks.filter(t => t.status?.isCompletedStatus).length / project._count.tasks) * 100)}%` : "0%"
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-muted-foreground">
                      {tasks.filter(t => t.status?.isCompletedStatus).length} / {project._count?.tasks || 0} tasks completed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Start and end dates for the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>

                  {project.dueDate && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Due Date</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(project.dueDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Tracking Card */}
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking</CardTitle>
                <CardDescription>
                  Estimated vs actual time spent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estimated Time</p>
                      <p className="text-sm text-muted-foreground">
                        {project.estimatedTime || 0} hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Time Spent</p>
                      <p className="text-sm text-muted-foreground">
                        {project.totalTimeSpent || 0} hours
                      </p>
                    </div>
                  </div>

                  {project.estimatedTime && project.totalTimeSpent && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.min(Math.round((project.totalTimeSpent / project.estimatedTime) * 100), 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(Math.round((project.totalTimeSpent / project.estimatedTime) * 100), 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Task Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
                <CardDescription>
                  Tasks by status and priority
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Tasks by Status */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tasks by Status</h4>
                    <div className="space-y-2">
                      {statuses.map(status => {
                        const statusTasks = tasks.filter(t => t.statusId === status.id);
                        const percentage = project._count?.tasks ?
                          Math.round((statusTasks.length / project._count.tasks) * 100) : 0;

                        return (
                          <div key={status.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: status.color }}
                                />
                                <span className="text-sm">{status.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {statusTasks.length} tasks ({percentage}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: status.color
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tasks by Priority */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tasks by Priority</h4>
                    <div className="space-y-2">
                      {['high', 'medium', 'low'].map(priority => {
                        const priorityTasks = tasks.filter(t => t.priority === priority);
                        const percentage = project._count?.tasks ?
                          Math.round((priorityTasks.length / project._count.tasks) * 100) : 0;

                        const priorityColor =
                          priority === 'high' ? '#ef4444' :
                          priority === 'medium' ? '#f59e0b' :
                          '#10b981';

                        return (
                          <div key={priority} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: priorityColor }}
                                />
                                <span className="text-sm capitalize">{priority}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {priorityTasks.length} tasks ({percentage}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: priorityColor
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

      {/* Add Team Member Dialog */}
      <AddTeamMemberDialog
        open={isTeamDialogOpen}
        onOpenChange={setIsTeamDialogOpen}
        projectId={projectId}
        onSuccess={fetchUsers}
        existingTeamMemberIds={users.map(user => user.id)}
      />

      {/* Remove Team Member Confirmation Dialog */}
      <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToRemove?.name || userToRemove?.email || "this user"} from the project team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTeamMember}
              disabled={isRemovingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingUser ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
