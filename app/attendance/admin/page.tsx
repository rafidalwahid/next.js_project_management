"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, CheckCircle, Users, History, User, AlertTriangle, RefreshCcw } from "lucide-react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { DASHBOARD_DEFAULTS } from "@/lib/constants/attendance"

// Dynamically import components with lazy loading
const TeamAnalyticsDashboard = dynamic(
  () => import('@/components/attendance/team-analytics-dashboard').then(mod => ({ default: mod.TeamAnalyticsDashboard })),
  { loading: () => <div className="w-full py-12 flex items-center justify-center"><Spinner size="lg" /></div>, ssr: false }
)

const AttendanceAuditLog = dynamic(
  () => import('@/components/attendance/attendance-audit-log').then(mod => ({ default: mod.AttendanceAuditLog })),
  { loading: () => <div className="w-full py-12 flex items-center justify-center"><Spinner size="lg" /></div>, ssr: false }
)

const EmployeeAttendanceProfile = dynamic(
  () => import('@/components/attendance/employee-attendance-profile').then(mod => ({ default: mod.EmployeeAttendanceProfile })),
  { loading: () => <div className="w-full py-12 flex items-center justify-center"><Spinner size="lg" /></div>, ssr: false }
)

// Create a new component for the attendance exceptions summary
const AttendanceExceptionsSummary = dynamic(
  () => import('@/components/attendance/attendance-exceptions-summary').then(mod => ({ default: mod.AttendanceExceptionsSummary })),
  { loading: () => <div className="w-full py-12 flex items-center justify-center"><Spinner size="lg" /></div>, ssr: false }
)

// Simplified project selector - lazy loaded
const ProjectSelector = dynamic(
  () => import('@/components/attendance/project-selector').then(mod => ({ default: mod.ProjectSelector })),
  { ssr: false }
)

// Simplified employee selector - lazy loaded  
const EmployeeSelector = dynamic(
  () => import('@/components/attendance/employee-selector').then(mod => ({ default: mod.EmployeeSelector })),
  { ssr: false }
)

// Dashboard metrics fetcher with SWR for better caching and re-validation
const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminAttendancePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("exceptions")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  
  // Use SWR for dashboard metrics with automatic revalidation
  const { data: dashboardMetrics, error: metricsError, mutate: refreshMetrics } = useSWR(
    '/api/attendance/admin/dashboard-metrics',
    fetcher,
    { 
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      revalidateOnFocus: true,
      dedupingInterval: 60000 // Deduplicate requests within 1 minute
    }
  )
  
  const isLoadingMetrics = !dashboardMetrics && !metricsError
  
  // Check if user has permission to access admin dashboard
  useEffect(() => {
    if (!session) return

    const userRole = session.user.role
    if (userRole !== "admin" && userRole !== "manager") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard",
        variant: "destructive"
      })
      router.push("/attendance/dashboard")
    }
  }, [session, router, toast])

  // Handle metrics error
  useEffect(() => {
    if (metricsError) {
      toast({
        title: "Error",
        description: "Failed to load dashboard metrics. Please try again.",
        variant: "destructive"
      })
    }
  }, [metricsError, toast])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance Administration</h1>
          <p className="text-muted-foreground">
            Manage and monitor team attendance
          </p>
        </div>
        
        {/* Today's Status Summary - Using the consolidated metrics data */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 flex items-center gap-1"
            onClick={() => refreshMetrics()}
            disabled={isLoadingMetrics}
          >
            <RefreshCcw className={`h-3 w-3 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          
          <Badge variant="outline" className="flex items-center gap-1 py-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>Present: </span>
            <span>{isLoadingMetrics ? '...' : dashboardMetrics?.presentCount ?? '0'}</span>
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1 py-1">
            <AlertCircle className="h-3 w-3 text-amber-600" />
            <span>Late: </span>
            <span>{isLoadingMetrics ? '...' : dashboardMetrics?.lateCount ?? '0'}</span>
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1 py-1">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            <span>Absent: </span>
            <span>{isLoadingMetrics ? '...' : dashboardMetrics?.absentCount ?? '0'}</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exceptions" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Exceptions</span>
            <span className="sm:hidden">Issues</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team Analytics</span>
            <span className="sm:hidden">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Employee Profile</span>
            <span className="sm:hidden">Employee</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Log</span>
            <span className="sm:hidden">Audit</span>
          </TabsTrigger>
        </TabsList>

        {/* Exceptions Tab - Shows attendance issues that need attention */}
        <TabsContent value="exceptions">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle>Recent Exceptions</CardTitle>
              <CardDescription>
                Latest attendance exceptions requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : dashboardMetrics?.recentExceptions?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardMetrics.recentExceptions.map(exception => (
                    <div key={exception.id} className="flex items-start gap-3 p-3 border rounded-md">
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{exception.action.replace('-', ' ')}</div>
                        <div className="text-sm text-muted-foreground">{exception.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(exception.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No recent exceptions found
                </p>
              )}
            </CardContent>
          </Card>
          
          <Suspense fallback={<div className="w-full py-12 flex items-center justify-center"><Spinner size="lg" /></div>}>
            <AttendanceExceptionsSummary />
          </Suspense>
        </TabsContent>

        {/* Optimized Analytics Tab - Only loads when selected */}
        <TabsContent value="analytics" className="space-y-4">
          {activeTab === "analytics" && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Project Selection</CardTitle>
                  <CardDescription>
                    Select a project to view team attendance analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectSelector 
                    value={selectedProjectId} 
                    onChange={setSelectedProjectId}
                  />
                </CardContent>
              </Card>

              <TeamAnalyticsDashboard 
                projectId={selectedProjectId === "all" ? undefined : selectedProjectId} 
              />
            </>
          )}
        </TabsContent>

        {/* Optimized Employee Tab - Only loads when selected */}
        <TabsContent value="employee" className="space-y-4">
          {activeTab === "employee" && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Employee Selection</CardTitle>
                  <CardDescription>
                    Select an employee to view their attendance profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmployeeSelector
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                  />
                </CardContent>
              </Card>

              {selectedUserId ? (
                <EmployeeAttendanceProfile userId={selectedUserId} />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Please select an employee to view their attendance profile
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Optimized Audit Log Tab - Only loads when selected */}
        <TabsContent value="audit">
          {activeTab === "audit" && <AttendanceAuditLog />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
