"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useProjects } from "@/hooks/use-data"
import { TeamAnalyticsDashboard } from "@/components/attendance/team-analytics-dashboard"
import { AttendanceAuditLog } from "@/components/attendance/attendance-audit-log"
import { EmployeeAttendanceProfile } from "@/components/attendance/employee-attendance-profile"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Users, History, User } from "lucide-react"

export default function AdminAttendancePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("analytics")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const { projects, isLoading: isLoadingProjects } = useProjects(1, 100)

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

  // Fetch users when component mounts
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoadingUsers(true)
        const response = await fetch("/api/users")
        const data = await response.json()

        if (response.ok) {
          setUsers(data.users || [])
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch users",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        })
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [toast])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance Administration</h1>
          <p className="text-muted-foreground">
            Manage and monitor team attendance
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
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

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Project Selection</CardTitle>
              <CardDescription>
                Select a project to view team attendance analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex items-center justify-center h-10">
                  <Spinner />
                </div>
              ) : (
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {Array.isArray(projects) && projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <TeamAnalyticsDashboard projectId={selectedProjectId === "all" ? undefined : selectedProjectId} />
        </TabsContent>

        <TabsContent value="employee" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Employee Selection</CardTitle>
              <CardDescription>
                Select an employee to view their attendance profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center h-10">
                  <Spinner />
                </div>
              ) : (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
        </TabsContent>

        <TabsContent value="audit">
          <AttendanceAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  )
}
