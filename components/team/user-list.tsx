"use client"

import Link from "next/link"
import { Edit, Trash, User as UserIcon, MoreHorizontal, ShieldCheck } from "lucide-react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/ui/role-badge"
import { useHasPermission } from "@/hooks/use-has-permission"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserSummary } from "@/types/user"

interface UserListProps {
  users: UserSummary[]
  onDelete: (userId: string) => void
}

export function UserList({ users, onDelete }: UserListProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  // Use permission-based checks instead of role-based checks
  const { hasPermission: canEditUsers } = useHasPermission("user_edit")
  const { hasPermission: canManageRoles } = useHasPermission("manage_roles")
  const { hasPermission: canDeleteUsers } = useHasPermission("user_delete")

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return "U"

    const nameParts = name.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    return name.substring(0, 2).toUpperCase()
  }

  if (users.length === 0) {
    return (
      <div className="rounded-md border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border-0 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3 py-1">
                  <Avatar className="h-9 w-9 border border-black/10">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name || "User"} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/profile/${user.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {user.name || "Unnamed User"}
                  </Link>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <RoleBadge role={user.role} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user.id}`} className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                    {canEditUsers && (
                      <DropdownMenuItem asChild>
                        <Link href={`/team/edit/${user.id}`} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canManageRoles && (
                      <DropdownMenuItem asChild>
                        <Link href={`/team/roles?userId=${user.id}`} className="cursor-pointer">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Manage Role
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canDeleteUsers && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(user.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
