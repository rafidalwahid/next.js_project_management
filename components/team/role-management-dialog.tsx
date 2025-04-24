"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleBadge } from "@/components/ui/role-badge"
import { teamApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface RoleManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMember: {
    id: string
    role: string
    user: {
      id: string
      name?: string
      email?: string
    }
    project: {
      id: string
      title?: string
    }
  } | null
  onRoleUpdated: () => void
}

export function RoleManagementDialog({
  open,
  onOpenChange,
  teamMember,
  onRoleUpdated
}: RoleManagementDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(teamMember?.role || "member")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (open && teamMember) {
      setSelectedRole(teamMember.role)
    }
    setError(null)
    onOpenChange(open)
  }

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!teamMember || !selectedRole) return

    // Don't submit if role hasn't changed
    if (selectedRole === teamMember.role) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await teamApi.updateTeamMember(teamMember.id, { role: selectedRole })

      toast({
        title: "Role updated",
        description: `Team member role has been updated to ${selectedRole}`,
      })

      onRoleUpdated()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error updating role:", err)
      setError(err.message || "Failed to update role. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get confirmation message based on role
  const getConfirmationMessage = () => {
    if (!teamMember) return ""

    const userName = teamMember.user.name || teamMember.user.email || "This user"
    const projectName = teamMember.project.title || "this project"
    const roleType = getRoleType(selectedRole)

    // If role hasn't changed
    if (selectedRole === teamMember.role) {
      return (
        <span>
          No change - {userName} will remain as{' '}
          <RoleBadge role={selectedRole} type={roleType} showTooltip={false} />
        </span>
      )
    }

    // If changing from one role to another
    if (teamMember.role !== selectedRole) {
      return (
        <span>
          Changing {userName} from{' '}
          <RoleBadge role={teamMember.role} type={getRoleType(teamMember.role)} showTooltip={false} />{' '}
          to{' '}
          <RoleBadge role={selectedRole} type={roleType} showTooltip={false} />
        </span>
      )
    }

    // Role-specific descriptions
    switch (selectedRole) {
      case "owner":
        return `${userName} will have full control over ${projectName}, including managing team members and deleting the project.`
      case "admin":
        return roleType === "system"
          ? `${userName} will have full access to all system features and settings.`
          : `${userName} will be able to manage team members and edit all aspects of ${projectName}.`
      case "manager":
        return roleType === "system"
          ? `${userName} will have elevated access to manage users and projects.`
          : `${userName} will be able to manage tasks and have limited team management abilities in ${projectName}.`
      case "member":
      case "user":
        return roleType === "system"
          ? `${userName} will have standard access to the system.`
          : `${userName} will have basic access to view and work on tasks in ${projectName}.`
      default:
        return `You are changing ${userName}'s role.`
    }
  }

  // Get role badge style based on role
  const getRoleStyle = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "manager":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "member":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  // Determine if this is a system or project role
  const getRoleType = (role: string): "system" | "project" => {
    // System roles
    if (["admin", "manager", "user"].includes(role)) {
      return "system"
    }
    // Project roles
    return "project"
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Team Member Role</DialogTitle>
          <DialogDescription>
            Update the role and permissions for this team member
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <Alert variant="outline" className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Role Types</AlertTitle>
            <AlertDescription>
              <p className="text-sm mt-1">
                <strong>Project Roles</strong> apply only to specific projects. <br />
                <strong>System Roles</strong> apply across the entire application.
              </p>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="project" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">Project Role</TabsTrigger>
              <TabsTrigger value="system">System Role</TabsTrigger>
            </TabsList>

            <TabsContent value="project" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="project-role">Project Role</Label>
                <div className="flex gap-2 flex-wrap">
                  {["owner", "admin", "manager", "member"].map(role => (
                    <div
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`cursor-pointer p-1 rounded-md ${selectedRole === role ? 'ring-2 ring-primary' : ''}`}
                    >
                      <RoleBadge role={role} type="project" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Project roles determine what actions a user can perform within a specific project.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="system-role">System Role</Label>
                <div className="flex gap-2 flex-wrap">
                  {["admin", "manager", "user"].map(role => (
                    <div
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`cursor-pointer p-1 rounded-md ${selectedRole === role ? 'ring-2 ring-primary' : ''}`}
                    >
                      <RoleBadge role={role} type="system" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  System roles determine what actions a user can perform across the entire application.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

          <div className="text-sm text-muted-foreground">
            {getConfirmationMessage()}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedRole === teamMember?.role}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Updating...
              </>
            ) : (
              "Update Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
