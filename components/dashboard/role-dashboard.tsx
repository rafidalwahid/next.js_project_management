"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserRole, useUserPermissions } from "@/hooks/use-permission"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck
} from "lucide-react"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { DashboardStats } from "@/types/dashboard"
import { AdminDashboard } from "./admin-dashboard"
import { ManagerDashboard } from "./manager-dashboard"
import { UserDashboard } from "./user-dashboard"

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

  // Determine which dashboard view to show based on user permissions
  const getDashboardView = () => {
    // Show loading skeleton while permissions or stats are being fetched
    if (roleLoading || statsLoading || permissionsLoading) {
      return <DashboardSkeleton />
    }

    // Check for specific permissions to determine which dashboard to show
    const hasSystemSettings = userPermissions.includes('system_settings');
    const hasProjectManagement = userPermissions.includes('project_management');

    // Show appropriate dashboard based on permissions
    if (hasSystemSettings) {
      // Admin-level permissions
      return <AdminDashboard stats={dashboardStats} />
    } else if (hasProjectManagement) {
      // Manager-level permissions
      return <ManagerDashboard stats={dashboardStats} />
    } else {
      // Regular user permissions
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
