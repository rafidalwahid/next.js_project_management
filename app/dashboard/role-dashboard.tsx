"use client"

import { useEffect, useState } from "react"
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

export function RoleDashboard() {
  const { data: session } = useSession()
  const { role: userRole, isLoading: roleLoading } = useUserRole()
  const { permissions: userPermissions, isLoading: permissionsLoading } = useUserPermissions()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    completedTasks: 0,
    teamMembers: 0,
    upcomingEvents: 0,
    attendanceRate: 0,
  })

  useEffect(() => {
    // Simulate loading stats
    const loadStats = async () => {
      setLoading(true)

      // In a real app, you would fetch this data from your API
      // For now, we'll just use dummy data
      setTimeout(() => {
        setStats({
          projects: 12,
          tasks: 48,
          completedTasks: 32,
          teamMembers: 8,
          upcomingEvents: 5,
          attendanceRate: 92,
        })
        setLoading(false)
      }, 1000)
    }

    loadStats()
  }, [])

  // Determine which dashboard view to show based on user role
  const getDashboardView = () => {
    // Show loading skeleton while role is being fetched
    if (roleLoading) {
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
      return <AdminDashboard stats={stats} loading={loading} />
    } else if (userRole === "manager") {
      return <ManagerDashboard stats={stats} loading={loading} />
    } else {
      return <UserDashboard stats={stats} loading={loading} />
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

function AdminDashboard({ stats, loading }: { stats: any, loading: boolean }) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Projects"
              value={stats.projects}
              description="Active projects across all teams"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
            <StatsCard
              title="Total Tasks"
              value={stats.tasks}
              description={`${stats.completedTasks} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
            <StatsCard
              title="Team Members"
              value={stats.teamMembers}
              description="Across all projects"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
            <StatsCard
              title="Attendance Rate"
              value={`${stats.attendanceRate}%`}
              description="Team average this month"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Overall system health and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>System Load</span>
                      <span className="font-medium">23%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database Status</span>
                      <span className="font-medium text-green-500">Healthy</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage Usage</span>
                      <span className="font-medium">42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Response Time</span>
                      <span className="font-medium">120ms</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest system-wide activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">New user registered</p>
                      <p className="text-muted-foreground">2 hours ago</p>
                    </div>
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">Project "Marketing Campaign" created</p>
                      <p className="text-muted-foreground">Yesterday at 15:32</p>
                    </div>
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">System backup completed</p>
                      <p className="text-muted-foreground">Yesterday at 02:00</p>
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

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Management</CardTitle>
              <CardDescription>
                Manage system settings and configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">System Management</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  System management tools would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ManagerDashboard({ stats, loading }: { stats: any, loading: boolean }) {
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
              value={stats.projects}
              description="Projects you're managing"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
            <StatsCard
              title="Pending Tasks"
              value={stats.tasks - stats.completedTasks}
              description={`${stats.completedTasks} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
            <StatsCard
              title="Team Members"
              value={stats.teamMembers}
              description="In your projects"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
            <StatsCard
              title="Upcoming Events"
              value={stats.upcomingEvents}
              description="In the next 7 days"
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>
                  Task completion and attendance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Task Completion Rate</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>On-time Delivery</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team Attendance</span>
                      <span className="font-medium">{stats.attendanceRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Task Duration</span>
                      <span className="font-medium">2.3 days</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
                <CardDescription>
                  Latest activities in your projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">Task "Design Homepage" completed</p>
                      <p className="text-muted-foreground">3 hours ago by John Doe</p>
                    </div>
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">New task added to "Marketing Campaign"</p>
                      <p className="text-muted-foreground">Yesterday at 14:20</p>
                    </div>
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">Project status updated to "In Progress"</p>
                      <p className="text-muted-foreground">Yesterday at 10:45</p>
                    </div>
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

function UserDashboard({ stats, loading }: { stats: any, loading: boolean }) {
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
              value={Math.floor(stats.projects / 2)}
              description="Projects you're part of"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
            <StatsCard
              title="My Tasks"
              value={Math.floor(stats.tasks / 4)}
              description={`${Math.floor(stats.completedTasks / 4)} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
            <StatsCard
              title="Upcoming Events"
              value={Math.floor(stats.upcomingEvents / 2)}
              description="In the next 7 days"
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              loading={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>My Performance</CardTitle>
                <CardDescription>
                  Your task completion and attendance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Task Completion Rate</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>On-time Delivery</span>
                      <span className="font-medium">96%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attendance Rate</span>
                      <span className="font-medium">{stats.attendanceRate + 3}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Task Duration</span>
                      <span className="font-medium">1.8 days</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">Completed task "Create User Flow"</p>
                      <p className="text-muted-foreground">Today at 10:30</p>
                    </div>
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">Checked in for the day</p>
                      <p className="text-muted-foreground">Today at 09:05</p>
                    </div>
                    <div className="border-l-2 border-primary pl-3">
                      <p className="font-medium">Commented on "Homepage Redesign"</p>
                      <p className="text-muted-foreground">Yesterday at 16:45</p>
                    </div>
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
          <Card>
            <CardHeader>
              <CardTitle>My Attendance</CardTitle>
              <CardDescription>
                View your attendance history and check in/out
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Attendance Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your attendance records would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
  icon,
  loading
}: {
  title: string
  value: number | string
  description: string
  icon: React.ReactNode
  loading: boolean
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
        {loading ? (
          <>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
