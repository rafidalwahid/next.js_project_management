"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Edit, Info, ShieldAlert, ShieldCheck, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Define role types and permissions
const ROLES = [
  {
    id: "admin",
    name: "Admin",
    description: "Full access to all resources and settings",
    color: "bg-purple-500",
    count: 1
  },
  {
    id: "manager",
    name: "Manager",
    description: "Can manage users and content but not system settings",
    color: "bg-green-500",
    count: 1
  },
  {
    id: "user",
    name: "User",
    description: "Regular user with limited access",
    color: "bg-blue-500",
    count: 2
  },
  {
    id: "guest",
    name: "Guest",
    description: "Minimal access for temporary users",
    color: "bg-gray-500",
    count: 1
  }
]

const PERMISSIONS = [
  { id: "user_management", name: "User Management", description: "Manage users, roles and permissions" },
  { id: "project_creation", name: "Project Creation", description: "Create new projects" },
  { id: "task_assignment", name: "Task Assignment", description: "Assign tasks to users" },
  { id: "task_management", name: "Task Management", description: "Create and manage tasks" },
  { id: "view_projects", name: "View Projects", description: "View project details" },
  { id: "edit_profile", name: "Edit Profile", description: "Edit own profile information" },
  { id: "system_settings", name: "System Settings", description: "Configure system settings" },
  { id: "project_management", name: "Project Management", description: "Manage existing projects" },
]

// Permission matrix - which roles have which permissions
const PERMISSION_MATRIX = {
  admin: [
    "user_management", "project_creation", "task_assignment", "task_management",
    "view_projects", "edit_profile", "system_settings", "project_management"
  ],
  manager: [
    "user_management", "project_creation", "task_assignment", "task_management",
    "view_projects", "edit_profile", "project_management"
  ],
  user: [
    "task_management", "view_projects", "edit_profile"
  ],
  guest: [
    "view_projects"
  ]
}

// Permission badges for the roles table
const PERMISSION_BADGES = {
  admin: [
    { id: "full_access", name: "Full Access", color: "bg-purple-500" },
    { id: "user_management", name: "User Management", color: "bg-blue-500" },
    { id: "system_settings", name: "System Settings", color: "bg-red-500" },
  ],
  manager: [
    { id: "user_management", name: "User Management", color: "bg-blue-500" },
    { id: "project_management", name: "Project Management", color: "bg-green-500" },
    { id: "task_assignment", name: "Task Assignment", color: "bg-yellow-500" },
  ],
  user: [
    { id: "task_management", name: "Task Management", color: "bg-yellow-500" },
    { id: "project_view", name: "Project View", color: "bg-green-500" },
    { id: "profile_edit", name: "Profile Edit", color: "bg-blue-500" },
  ],
  guest: [
    { id: "limited_view", name: "Limited View", color: "bg-gray-500" },
    { id: "profile_view", name: "Profile View", color: "bg-blue-500" },
  ],
}

export default function RolePermissionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("roles")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(PERMISSION_MATRIX)

  // Check if user is admin
  useEffect(() => {
    if (session?.user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive"
      })
      router.push("/dashboard")
    }
  }, [session, router, toast])

  // Handle permission toggle
  const togglePermission = (role: string, permission: string) => {
    setRolePermissions(prev => {
      const newPermissions = { ...prev }

      if (newPermissions[role].includes(permission)) {
        // Remove permission
        newPermissions[role] = newPermissions[role].filter(p => p !== permission)
      } else {
        // Add permission
        newPermissions[role] = [...newPermissions[role], permission]
      }

      return newPermissions
    })
  }

  // Fetch role permissions from API
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch("/api/roles/permissions")
        if (!response.ok) throw new Error("Failed to fetch permissions")
        const data = await response.json()
        setRolePermissions(data)
      } catch (error) {
        console.error("Error fetching permissions:", error)
        toast({
          title: "Error",
          description: "Failed to load role permissions",
          variant: "destructive"
        })
      }
    }

    if (session?.user?.role === "admin") {
      fetchPermissions()
    }
  }, [session, toast])

  // Save role permissions
  const saveRolePermissions = async () => {
    try {
      const response = await fetch("/api/roles/permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          permissions: rolePermissions
        })
      })

      if (!response.ok) throw new Error("Failed to update permissions")

      toast({
        title: "Permissions Updated",
        description: "Role permissions have been updated successfully",
      })
      setEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive"
      })
    }
  }

  // Get role badge
  const getRoleBadge = (roleId: string) => {
    const role = ROLES.find(r => r.id === roleId)
    if (!role) return null

    switch (roleId) {
      case "admin":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            <ShieldCheck className="h-3 w-3 mr-1" />
            {role.name}
          </Badge>
        )
      case "manager":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <Shield className="h-3 w-3 mr-1" />
            {role.name}
          </Badge>
        )
      case "user":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Shield className="h-3 w-3 mr-1" />
            {role.name}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Shield className="h-3 w-3 mr-1" />
            {role.name}
          </Badge>
        )
    }
  }

  if (session?.user?.role !== "admin") {
    return null // Don't render anything if not admin
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Roles Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="roles">Available Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Roles</CardTitle>
              <CardDescription>
                These roles define what users can access and modify within the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ROLES.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <div className={`h-3 w-3 rounded-full ${role.color}`}></div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {role.name}
                        </TableCell>
                        <TableCell>
                          {role.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {PERMISSION_BADGES[role.id as keyof typeof PERMISSION_BADGES].map((badge) => (
                              <Badge key={badge.id} className={`${badge.color} text-white`}>
                                {badge.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="rounded-full">
                            {role.count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
              <CardDescription>
                Detailed breakdown of permissions by role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      {ROLES.map((role) => (
                        <TableHead key={role.id} className="text-center">
                          {getRoleBadge(role.id)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSIONS.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {permission.name}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{permission.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        {ROLES.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            {rolePermissions[role.id].includes(permission.id) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6">
                <Button onClick={() => setEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions</DialogTitle>
            <DialogDescription>
              Customize which permissions are granted to each role
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    {ROLES.map((role) => (
                      <TableHead key={role.id} className="text-center">
                        {getRoleBadge(role.id)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSIONS.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {permission.name}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{permission.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      {ROLES.map((role) => (
                        <TableCell key={role.id} className="text-center">
                          <Button
                            variant={rolePermissions[role.id].includes(permission.id) ? "default" : "outline"}
                            size="sm"
                            className={rolePermissions[role.id].includes(permission.id) ? "bg-green-500 hover:bg-green-600" : ""}
                            onClick={() => togglePermission(role.id, permission.id)}
                          >
                            {rolePermissions[role.id].includes(permission.id) ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRolePermissions}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
