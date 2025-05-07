"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserRole, useUserPermissions } from "@/hooks/use-permission"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { DashboardStats, ProjectSummary, SystemStats, TaskSummary } from "@/types/dashboard"
import {
  calculateTaskStats,
  calculateTeamMembers,
  calculateProjectStatusDistribution,
  extractTasksFromProjects
} from "@/utils/dashboard-utils"

// StatsCard component definition
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

export function RoleDashboard() {
  const { data: session } = useSession()
  const { role: userRole, isLoading: roleLoading } = useUserRole()
  const { permissions: userPermissions, isLoading: permissionsLoading } = useUserPermissions()
  const { stats, isLoading: statsLoading, refetch } = useDashboardStats()

  // Ensure stats has the correct type
  const dashboardStats: DashboardStats = stats || {
    totalProjects: 0,
    recentProjects: [],
    projectGrowth: 0,
    systemStats: null
  }

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
      return <AdminDashboard stats={dashboardStats} />
    } else if (userRole === "manager") {
      return <ManagerDashboard stats={dashboardStats} />
    } else {
      return <UserDashboard stats={dashboardStats} />
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

function AdminDashboard({ stats }: { stats: DashboardStats }) {
  // Get system-wide stats (admin only)
  const systemStats: SystemStats = stats?.systemStats || {
    totalUsers: 0,
    usersByRole: { admin: 0, manager: 0, user: 0 },
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0
  }

  // Get derived stats directly from the API response
  const totalProjects = stats?.totalProjects || 0
  const recentProjects = stats?.recentProjects || []
  const projectGrowth = stats?.projectGrowth || 0

  // Calculate project status distribution
  const projectStatusDistribution = calculateProjectStatusDistribution(recentProjects)

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {/* Organization-wide metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Projects"
              value={totalProjects}
              description={projectGrowth > 0 ? `+${projectGrowth}% growth` : projectGrowth < 0 ? `${projectGrowth}% decline` : "No change"}
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Total Tasks"
              value={systemStats.totalTasks}
              description={`${systemStats.completedTasks} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Total Users"
              value={systemStats.totalUsers}
              description={`${systemStats.usersByRole.manager} managers, ${systemStats.usersByRole.user} users`}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="System Completion Rate"
              value={`${systemStats.completionRate}%`}
              description="Tasks completed across all projects"
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Most recently updated projects
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>
                  Users by role in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Administrators</span>
                        <span className="font-medium">{systemStats.usersByRole.admin}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${systemStats.totalUsers ? (systemStats.usersByRole.admin / systemStats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Managers</span>
                        <span className="font-medium">{systemStats.usersByRole.manager}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${systemStats.totalUsers ? (systemStats.usersByRole.manager / systemStats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Regular Users</span>
                        <span className="font-medium">{systemStats.usersByRole.user}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${systemStats.totalUsers ? (systemStats.usersByRole.user / systemStats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>
                  Distribution of project statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Not Started</span>
                        <span className="font-medium">{projectStatusDistribution.notStarted}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-500"
                          style={{ width: `${recentProjects.length ? (projectStatusDistribution.notStarted / recentProjects.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>In Progress</span>
                        <span className="font-medium">{projectStatusDistribution.inProgress}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${recentProjects.length ? (projectStatusDistribution.inProgress / recentProjects.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span className="font-medium">{projectStatusDistribution.completed}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${recentProjects.length ? (projectStatusDistribution.completed / recentProjects.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                Overall system metrics and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Task Completion</h3>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-4 mr-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-4"
                          style={{ width: `${systemStats.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{systemStats.completionRate}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {systemStats.completedTasks} of {systemStats.totalTasks} tasks completed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Project Growth</h3>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-4 mr-2 overflow-hidden">
                        <div
                          className={`h-4 ${projectGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Math.abs(projectGrowth), 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{projectGrowth >= 0 ? '+' : ''}{projectGrowth}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Project growth rate compared to last month
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Reports</CardTitle>
                <CardDescription>
                  Generate and view system reports
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md">
                  <div className="flex items-center p-4 border-b">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">User Activity Report</p>
                      <p className="text-xs text-muted-foreground">
                        Summary of user logins and activities
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center p-4 border-b">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Project Completion Report</p>
                      <p className="text-xs text-muted-foreground">
                        Analysis of project completion rates
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center p-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Attendance Summary</p>
                      <p className="text-xs text-muted-foreground">
                        Overview of attendance patterns
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ManagerDashboard({ stats }: { stats: DashboardStats }) {
  // Get derived stats directly from the API response
  const totalProjects = stats?.totalProjects || 0
  const recentProjects = stats?.recentProjects || []
  const projectGrowth = stats?.projectGrowth || 0

  // Use utility functions for calculations
  const { totalTasks, completedTasks, pendingTasks, completionRate } = calculateTaskStats(recentProjects)
  const { teamMembersCount } = calculateTeamMembers(recentProjects)

  // Calculate project status distribution
  const projectStatusDistribution = calculateProjectStatusDistribution(recentProjects)

  // Group projects by status for display
  const projectsByStatus = {
    notStarted: recentProjects.filter(p => p.progress === 0),
    inProgress: recentProjects.filter(p => p.progress > 0 && p.progress < 100),
    completed: recentProjects.filter(p => p.progress === 100)
  }

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
              title="Your Projects"
              value={totalProjects}
              description="Projects you're involved with"
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
                        {projectsByStatus.inProgress.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Projects</span>
                      <span className="font-medium">
                        {projectsByStatus.completed.length}
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

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage your team members and their assignments
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </CardHeader>
            <CardContent>
              {teamMembersCount === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Team Members</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any team members in your projects yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-md">
                    {recentProjects.slice(0, 3).map(project => (
                      <div key={project.id} className="border-b last:border-0">
                        <div className="p-4">
                          <h3 className="font-medium">{project.title}</h3>
                          <div className="mt-2 space-y-2">
                            {project.team?.slice(0, 3).map(member => (
                              <div key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                                    {member.image ? (
                                      <img
                                        src={member.image}
                                        alt={member.name || 'Team member'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs bg-primary text-primary-foreground">
                                        {member.name?.charAt(0) || '?'}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{member.name}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">Manage</Button>
                              </div>
                            ))}
                            {project.team?.length > 3 && (
                              <div className="text-center text-sm text-muted-foreground pt-2">
                                +{project.team.length - 3} more team members
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Manage your projects and their progress
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Layers className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Projects</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any projects yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-md divide-y">
                    {recentProjects.map(project => (
                      <div key={project.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {project.taskCount} tasks • {project.teamCount} team members
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-muted">
                              {project.progress}% complete
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button variant="ghost" size="sm">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}



function UserDashboard({ stats }: { stats: DashboardStats }) {
  // Get derived stats directly from the API response
  const totalProjects = stats?.totalProjects || 0
  const recentProjects = stats?.recentProjects || []
  const projectGrowth = stats?.projectGrowth || 0

  // Use utility functions for calculations
  const { totalTasks, completedTasks, pendingTasks, completionRate } = calculateTaskStats(recentProjects)

  // Extract tasks from projects (simulated for this implementation)
  // This will be replaced with real API data in the future
  const myTasks: TaskSummary[] = extractTasksFromProjects(recentProjects)

  // Get upcoming tasks (not completed, sorted by due date)
  const upcomingTasks = myTasks
    .filter(task => !task.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

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
              description={`${completedTasks} completed, ${pendingTasks} pending`}
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
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>
                  Your pending tasks with nearest deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingTasks.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No upcoming tasks
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="flex items-start space-x-2">
                        <div className={`mt-0.5 h-4 w-4 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                        }`} />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>{task.projectTitle}</span>
                            <span className="mx-1">•</span>
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>
                  View and manage your assigned tasks
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button variant="default" size="sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {myTasks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Tasks</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any tasks assigned to you
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="rounded-md border">
                    <div className="bg-muted px-4 py-2 flex items-center text-sm font-medium">
                      <div className="w-6"></div>
                      <div className="flex-1 ml-2">Task</div>
                      <div className="w-28 text-right">Project</div>
                      <div className="w-28 text-right">Due Date</div>
                      <div className="w-20 text-right">Priority</div>
                    </div>
                    <div className="divide-y">
                      {myTasks.slice(0, 10).map(task => (
                        <div key={task.id} className={`px-4 py-3 flex items-center text-sm ${task.completed ? 'bg-muted/50' : ''}`}>
                          <div className="w-6">
                            <div className="h-4 w-4 rounded border border-primary flex items-center justify-center">
                              {task.completed && <CheckCircle2 className="h-3 w-3 text-primary" />}
                            </div>
                          </div>
                          <div className="flex-1 ml-2">
                            <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                              {task.title}
                            </span>
                          </div>
                          <div className="w-28 text-right text-muted-foreground truncate">
                            {task.projectTitle}
                          </div>
                          <div className="w-28 text-right">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          <div className="w-20 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {myTasks.length > 10 && (
                    <div className="text-center pt-2">
                      <Button variant="link" size="sm">
                        View all {myTasks.length} tasks
                      </Button>
                    </div>
                  )}
                </div>
              )}
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

