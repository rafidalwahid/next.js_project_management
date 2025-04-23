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
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
    
    switch (selectedRole) {
      case "owner":
        return `${userName} will have full control over ${projectName}, including managing team members and deleting the project.`
      case "admin":
        return `${userName} will be able to manage team members and edit all aspects of ${projectName}.`
      case "manager":
        return `${userName} will be able to manage tasks and have limited team management abilities in ${projectName}.`
      case "member":
        return `${userName} will have basic access to view and work on tasks in ${projectName}.`
      default:
        return `You are changing ${userName}'s role in ${projectName}.`
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
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={selectedRole} 
              onValueChange={handleRoleChange}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role" className={getRoleStyle(selectedRole)}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner" className={getRoleStyle("owner")}>Owner</SelectItem>
                <SelectItem value="admin" className={getRoleStyle("admin")}>Admin</SelectItem>
                <SelectItem value="manager" className={getRoleStyle("manager")}>Manager</SelectItem>
                <SelectItem value="member" className={getRoleStyle("member")}>Member</SelectItem>
              </SelectContent>
            </Select>
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
