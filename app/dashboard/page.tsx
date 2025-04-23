import Link from "next/link"
import { BarChart3, Calendar, CheckSquare, Clock, Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { ProjectCard } from "@/components/project-card"
import { RecentActivity } from "@/components/recent-activity"

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="attendance" asChild>
            <Link href="/attendance/dashboard">Attendance</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {/* Dashboard Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 since last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">34</div>
                <p className="text-xs text-muted-foreground">-4 since last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+4 since last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground">+2 since last week</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>You currently have 12 active projects</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <ProjectCard
                  title="Website Redesign"
                  description="Complete update of the corporate website"
                  progress={75}
                  dueDate="15 Mar 2025"
                  team={5}
                  tasks={24}
                  completedTasks={18}
                />
                <ProjectCard
                  title="CRM Implementation"
                  description="Integration of the new CRM system with existing systems"
                  progress={45}
                  dueDate="30 Abr 2025"
                  team={8}
                  tasks={42}
                  completedTasks={19}
                />
                <ProjectCard
                  title="Q2 Marketing Campaign"
                  description="Planning and execution of the second quarter campaign"
                  progress={20}
                  dueDate="10 May 2025"
                  team={4}
                  tasks={18}
                  completedTasks={4}
                />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates in your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Project Performance</CardTitle>
              <CardDescription>Analysis of functionality and usability metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Website Redesign</div>
                  <div className="text-sm text-muted-foreground">75%</div>
                </div>
                <Progress value={75} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">CRM Implementation</div>
                  <div className="text-sm text-muted-foreground">45%</div>
                </div>
                <Progress value={45} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Q2 Marketing Campaign</div>
                  <div className="text-sm text-muted-foreground">20%</div>
                </div>
                <Progress value={20} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Mobile App Development</div>
                  <div className="text-sm text-muted-foreground">60%</div>
                </div>
                <Progress value={60} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
              <CardDescription>Detailed reports on project status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="font-medium">Weekly Progress Report</div>
                  <div className="text-sm text-muted-foreground">
                    Summary of progress for all active projects during the last week
                  </div>
                  <Button variant="outline" size="sm" className="w-fit">
                    Download PDF
                  </Button>
                </div>
                <div className="grid gap-2">
                  <div className="font-medium">Resource Allocation Report</div>
                  <div className="text-sm text-muted-foreground">
                    Detailed analysis of resource allocation across all projects
                  </div>
                  <Button variant="outline" size="sm" className="w-fit">
                    Download PDF
                  </Button>
                </div>
                <div className="grid gap-2">
                  <div className="font-medium">Team Performance Report</div>
                  <div className="text-sm text-muted-foreground">
                    Evaluation of team members' performance in projects
                  </div>
                  <Button variant="outline" size="sm" className="w-fit">
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
