"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Edit, Info, ShieldAlert, ShieldCheck, Shield, Plus, UserPlus, Loader2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

      // Initialize the role's permissions array if it doesn't exist
      if (!newPermissions[role]) {
        newPermissions[role] = []
      }

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

  const [allPermissions, setAllPermissions] = useState<any[]>([])
  const [allRoles, setAllRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPermissionDialogOpen, setNewPermissionDialogOpen] = useState(false)
  const [newPermissionData, setNewPermissionData] = useState({
    name: "",
    description: "",
    category: "general"
  })
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false)
  const [newRoleData, setNewRoleData] = useState({
    name: "",
    description: ""
  })

  // Fetch role permissions from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all roles first
        const allRolesResponse = await fetch("/api/roles")
        if (!allRolesResponse.ok) {
          throw new Error("Failed to fetch all roles")
        }
        const allRolesData = await allRolesResponse.json()
        setAllRoles(allRolesData)

        // Fetch all permissions
        const allPermissionsResponse = await fetch("/api/permissions")
        if (!allPermissionsResponse.ok) {
          throw new Error("Failed to fetch all permissions")
        }
        const allPermissionsData = await allPermissionsResponse.json()
        setAllPermissions(allPermissionsData)

        // Fetch permissions matrix
        const permissionsResponse = await fetch("/api/roles/permissions")
        if (!permissionsResponse.ok) {
          throw new Error("Failed to fetch permissions")
        }
        const permissionsData = await permissionsResponse.json()
        setRolePermissions(permissionsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load role permissions",
          variant: "destructive"
        })
        // Set default values if API calls fail
        setAllRoles(prevRoles => prevRoles.length ? prevRoles : ROLES)
        setRolePermissions(prevPermissions =>
          Object.keys(prevPermissions).length ? prevPermissions : PERMISSION_MATRIX
        )
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchData()
    }
  }, [session, toast, allRoles.length])

  // Save role permissions
  const saveRolePermissions = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  // Create a new permission
  const createPermission = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPermissionData)
      })

      if (!response.ok) throw new Error("Failed to create permission")

      toast({
        title: "Permission Created",
        description: `Permission '${newPermissionData.name}' has been created successfully`,
      })

      // Reset form and close dialog
      setNewPermissionData({ name: "", description: "", category: "general" })
      setNewPermissionDialogOpen(false)

      // Refresh data
      const allPermissionsResponse = await fetch("/api/permissions")
      if (!allPermissionsResponse.ok) throw new Error("Failed to fetch all permissions")
      const allPermissionsData = await allPermissionsResponse.json()
      setAllPermissions(allPermissionsData)
    } catch (error) {
      console.error("Error creating permission:", error)
      toast({
        title: "Error",
        description: "Failed to create permission",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Create a new role
  const createRole = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newRoleData)
      })

      if (!response.ok) throw new Error("Failed to create role")

      toast({
        title: "Role Created",
        description: `Role '${newRoleData.name}' has been created successfully`,
      })

      // Reset form and close dialog
      setNewRoleData({ name: "", description: "" })
      setNewRoleDialogOpen(false)

      // Refresh data
      const allRolesResponse = await fetch("/api/roles")
      if (!allRolesResponse.ok) throw new Error("Failed to fetch all roles")
      const allRolesData = await allRolesResponse.json()
      setAllRoles(allRolesData)

      // Update permission matrix
      const permissionsResponse = await fetch("/api/roles/permissions")
      if (!permissionsResponse.ok) throw new Error("Failed to fetch permissions")
      const permissionsData = await permissionsResponse.json()
      setRolePermissions(permissionsData)
    } catch (error) {
      console.error("Error creating role:", error)
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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
                            {rolePermissions[role.id]?.includes(permission.id) ? (
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

                      <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={() => setEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Permissions
                </Button>
                <Button variant="outline" onClick={() => setNewPermissionDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Permission
                </Button>
                <Button variant="outline" onClick={() => setNewRoleDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Permissions Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions</DialogTitle>
            <DialogDescription>
              Customize which permissions are granted to each role
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading permissions...</span>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      {allRoles.map((role) => (
                        <TableHead key={role.id} className="text-center">
                          {getRoleBadge(role.name)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPermissions.map((permission) => (
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
                        {allRoles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            <Button
                              variant={rolePermissions[role.name]?.includes(permission.name) ? "default" : "outline"}
                              size="sm"
                              className={rolePermissions[role.name]?.includes(permission.name) ? "bg-green-500 hover:bg-green-600" : ""}
                              onClick={() => togglePermission(role.name, permission.name)}
                              disabled={role.isSystem && permission.isSystem}
                            >
                              {rolePermissions[role.name]?.includes(permission.name) ? (
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRolePermissions} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Permission Dialog */}
      <Dialog open={newPermissionDialogOpen} onOpenChange={setNewPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
            <DialogDescription>
              Create a new permission that can be assigned to roles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="permission-name">Permission Name</Label>
              <Input
                id="permission-name"
                placeholder="e.g. manage_projects"
                value={newPermissionData.name}
                onChange={(e) => setNewPermissionData({ ...newPermissionData, name: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Use lowercase letters and underscores, no spaces
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission-description">Description</Label>
              <Textarea
                id="permission-description"
                placeholder="Describe what this permission allows"
                value={newPermissionData.description}
                onChange={(e) => setNewPermissionData({ ...newPermissionData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission-category">Category</Label>
              <Select
                value={newPermissionData.category}
                onValueChange={(value) => setNewPermissionData({ ...newPermissionData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPermissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createPermission} disabled={loading || !newPermissionData.name}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Permission"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={newRoleDialogOpen} onOpenChange={setNewRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role with custom permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g. project_manager"
                value={newRoleData.name}
                onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Use lowercase letters and underscores, no spaces
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe this role's responsibilities"
                value={newRoleData.description}
                onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createRole} disabled={loading || !newRoleData.name}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
