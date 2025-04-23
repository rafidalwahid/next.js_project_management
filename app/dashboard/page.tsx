'use client';

import {
  ArrowUpRight,
  ArrowDownRight,
  Briefcase
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectCard } from "@/components/project-card"
import { Progress } from "@/components/ui/progress"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { stats, isLoading, isError } = useDashboardStats();

  // Remove loading state since we have fallback data
  if (isError) {
    return <div>Error loading dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Total Projects</span>
                    <span className="text-2xl font-bold">{stats.totalProjects}</span>
                  </div>
                  <div className="p-3 bg-primary/10 text-primary rounded-full">
                    <Briefcase className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`flex items-center ${stats.projectGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stats.projectGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{Math.abs(stats.projectGrowth)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Section */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>
                    You have {stats.totalProjects} active projects
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {stats.recentProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.title}
                    description={project.description || ''}
                    progress={project.progress}
                    team={project.teamCount}
                    tasks={project.taskCount}
                    completedTasks={project.completedTaskCount}
                  />
                ))}
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
    </div>
  )
}
