"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserRole, useUserPermissions } from "@/hooks/use-permission"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Users
} from "lucide-react"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { AttendanceWidget } from "@/components/attendance/attendance-widget"
import { AttendanceSummary } from "@/components/dashboard/attendance-summary"

export function RoleDashboard() {
  const { data: session } = useSession()
  const { role: userRole, isLoading: roleLoading } = useUserRole()
  const { permissions: userPermissions, isLoading: permissionsLoading } = useUserPermissions()
  const { stats, isLoading: statsLoading } = useDashboardStats()

  // Determine which dashboard view to show based on user role
  const getDashboardView = () => {
    // Show loading skeleton while role or stats are being fetched
    if (roleLoading || statsLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      )
    }

    // Once role is loaded, show the appropriate dashboard
    if (userRole === "admin") {
      return <AdminDashboard stats={stats} />
    } else if (userRole === "manager") {
      return <ManagerDashboard stats={stats} />
    } else {
      return <UserDashboard stats={stats} />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {session?.user?.name}</h2>
        <div className="flex flex-wrap gap-2">
          {roleLoading ? (
            <>
              <Skeleton className="h-6 w-20" />
            </>
          ) : (
            <Badge key={userRole} variant="outline" className="capitalize">
              {userRole === "admin" ? (
                <ShieldAlert className="mr-1 h-3 w-3" />
              ) : userRole === "manager" ? (
                <ShieldCheck className="mr-1 h-3 w-3" />
              ) : null}
              {userRole}
            </Badge>
          )}
        </div>
      </div>

      {getDashboardView()}

      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>
            These are the actions you can perform in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userPermissions.map(permission => (
                <Badge key={permission} variant="secondary" className="capitalize">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {permission.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminDashboard({ stats }: { stats: any }) {
  // Calculate derived stats
  const totalProjects = stats?.totalProjects || 0
  const recentProjects = stats?.recentProjects || []
  const projectGrowth = stats?.projectGrowth || 0

  // Calculate total tasks and completed tasks from recent projects
  const totalTasks = recentProjects.reduce((sum, project) => sum + (project.taskCount || 0), 0)
  const completedTasks = recentProjects.reduce((sum, project) => sum + (project.completedTaskCount || 0), 0)

  // Calculate team members (unique users across projects)
  const teamMembersSet = new Set()
  recentProjects.forEach(project => {
    project.team?.forEach(member => {
      if (member?.id) teamMembersSet.add(member.id)
    })
  })
  const teamMembersCount = teamMembersSet.size

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Projects"
              value={totalProjects}
              description={projectGrowth > 0 ? `+${projectGrowth}% growth` : projectGrowth < 0 ? `${projectGrowth}% decline` : "No change"}
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Total Tasks"
              value={totalTasks}
              description={`${completedTasks} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Team Members"
              value={teamMembersCount}
              description="Across all projects"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Completion Rate"
              value={`${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`}
              description="Tasks completed"
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your most recently updated projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent projects found
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    {recentProjects.slice(0, 3).map(project => (
                      <div key={project.id} className="border-l-2 border-primary pl-3">
                        <p className="font-medium">{project.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {project.taskCount} tasks ({project.progress}% complete)
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {project.team?.slice(0, 3).map(member => (
                            <div key={member.id} className="w-5 h-5 rounded-full bg-muted overflow-hidden">
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name || 'Team member'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] bg-primary text-primary-foreground">
                                  {member.name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                          ))}
                          {project.team?.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{project.team.length - 3}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
                <CardDescription>
                  Project completion status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No project data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {recentProjects.slice(0, 5).map(project => (
                        <div key={project.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[180px]">{project.title}</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Detailed analytics and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Analytics Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Detailed analytics view would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>System Reports</CardTitle>
              <CardDescription>
                Generate and view system reports
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Reports Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  System reports would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ManagerDashboard({ stats }: { stats: any }) {
  // Calculate derived stats
  const totalProjects = stats?.totalProjects || 0
  const recentProjects = stats?.recentProjects || []

  // Calculate total tasks and completed tasks from recent projects
  const totalTasks = recentProjects.reduce((sum, project) => sum + (project.taskCount || 0), 0)
  const completedTasks = recentProjects.reduce((sum, project) => sum + (project.completedTaskCount || 0), 0)
  const pendingTasks = totalTasks - completedTasks

  // Calculate team members (unique users across projects)
  const teamMembersSet = new Set()
  recentProjects.forEach(project => {
    project.team?.forEach(member => {
      if (member?.id) teamMembersSet.add(member.id)
    })
  })
  const teamMembersCount = teamMembersSet.size

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Active Projects"
              value={totalProjects}
              description="Projects you're managing"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Pending Tasks"
              value={pendingTasks}
              description={`${completedTasks} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Team Members"
              value={teamMembersCount}
              description="In your projects"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Completion Rate"
              value={`${completionRate}%`}
              description="Tasks completed"
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>
                  Task completion and project metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No project data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Task Completion Rate</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects in Progress</span>
                      <span className="font-medium">
                        {recentProjects.filter(p => p.progress > 0 && p.progress < 100).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Projects</span>
                      <span className="font-medium">
                        {recentProjects.filter(p => p.progress === 100).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Project Progress</span>
                      <span className="font-medium">
                        {recentProjects.length > 0
                          ? Math.round(recentProjects.reduce((sum, p) => sum + p.progress, 0) / recentProjects.length)
                          : 0}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your most recently updated projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent projects found
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    {recentProjects.slice(0, 3).map(project => (
                      <div key={project.id} className="border-l-2 border-primary pl-3">
                        <p className="font-medium">{project.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {project.taskCount} tasks ({project.progress}% complete)
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {project.team?.slice(0, 3).map(member => (
                            <div key={member.id} className="w-5 h-5 rounded-full bg-muted overflow-hidden">
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name || 'Team member'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] bg-primary text-primary-foreground">
                                  {member.name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                          ))}
                          {project.team?.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{project.team.length - 3}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage your team members and their assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Team Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Team management tools would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>
                Manage your projects and their progress
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Projects Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Project management tools would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UserDashboard({ stats }: { stats: any }) {
  // Calculate derived stats
  const totalProjects = stats?.totalProjects || 0
  const recentProjects = stats?.recentProjects || []

  // Calculate total tasks and completed tasks from recent projects
  const totalTasks = recentProjects.reduce((sum, project) => sum + (project.taskCount || 0), 0)
  const completedTasks = recentProjects.reduce((sum, project) => sum + (project.completedTaskCount || 0), 0)

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="attendance">My Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="My Projects"
              value={totalProjects}
              description="Projects you're part of"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="My Tasks"
              value={totalTasks}
              description={`${completedTasks} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Completion Rate"
              value={`${completionRate}%`}
              description="Tasks completed"
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>
                  Your current project status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No project data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {recentProjects.slice(0, 4).map(project => (
                        <div key={project.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[180px]">{project.title}</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your most recently updated projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent projects found
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    {recentProjects.slice(0, 3).map(project => (
                      <div key={project.id} className="border-l-2 border-primary pl-3">
                        <p className="font-medium">{project.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {project.taskCount} tasks ({project.progress}% complete)
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {project.team?.slice(0, 3).map(member => (
                            <div key={member.id} className="w-5 h-5 rounded-full bg-muted overflow-hidden">
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name || 'Team member'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] bg-primary text-primary-foreground">
                                  {member.name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                          ))}
                          {project.team?.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{project.team.length - 3}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>
                View and manage your assigned tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Tasks Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your tasks would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1">
              {/* Full Attendance Widget */}
              <div className="col-span-1">
                <AttendanceWidget />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Today's Overview */}
              <AttendanceSummary period="today" title="Today's Overview" />

              {/* This Week */}
              <AttendanceSummary period="week" title="This Week" />

              {/* This Month */}
              <AttendanceSummary period="month" title="This Month" className="sm:col-span-2 lg:col-span-1" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
  icon
}: {
  title: string
  value: number | string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
