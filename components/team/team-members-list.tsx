'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTeamMembers, useRemoveTeamMember } from '@/hooks/use-team-management';
import { useUsers } from '@/hooks/use-users';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/role-badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Search, Trash, MoreHorizontal, UserCircle, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useHasPermission } from '@/hooks/use-has-permission';

interface TeamMembersListProps {
  projectId?: string;
  limit?: number;
}

export function TeamMembersList({ projectId, limit = 10 }: TeamMembersListProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [teamMemberToDelete, setTeamMemberToDelete] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);
  const [isUserDeleting, setIsUserDeleting] = useState(false);

  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission: canDeleteTeamMembers } = useHasPermission('team_remove');
  const { hasPermission: canAddMembers } = useHasPermission('team_add');
  const { hasPermission: canDeleteUsers } = useHasPermission('user_delete');
  const { hasPermission: canManageUsers } = useHasPermission('user_management');

  const { teamMembers, isLoading, isError, mutate } = useTeamMembers(
    projectId,
    page,
    limit,
    searchQuery
  );

  // Fetch users as a fallback when no team members are found
  const {
    users,
    isLoading: isLoadingUsers,
    mutate: mutateUsers,
  } = useUsers({
    search: searchQuery,
    page: page,
    limit: limit,
  });

  const { removeTeamMember, isRemoving } = useRemoveTeamMember();

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const confirmDelete = (teamMember: any) => {
    if (!canDeleteTeamMembers) {
      toast({
        title: 'Permission Denied',
        description: "You don't have permission to delete team members.",
        variant: 'destructive',
      });
      return;
    }

    setTeamMemberToDelete({
      id: teamMember.id,
      name: teamMember.user?.name,
      email: teamMember.user?.email,
    });
    setConfirmDeleteDialogOpen(true);
  };

  const confirmUserDelete = (user: { id: string; name: string | null; email: string }) => {
    console.log('Confirming user delete:', {
      userId: user.id,
      canDeleteUsers,
      canManageUsers
    });

    if (!canDeleteUsers && !canManageUsers) {
      console.log('Permission denied for user deletion');
      toast({
        title: 'Permission Denied',
        description: "You don't have permission to delete users.",
        variant: 'destructive',
      });
      return;
    }

    if (user.id === session?.user?.id) {
      console.log('Attempted to delete own account');
      toast({
        title: 'Action Denied',
        description: "You cannot delete your own account.",
        variant: 'destructive',
      });
      return;
    }

    setUserToDelete(user);
    setIsUserDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!teamMemberToDelete) return;

    try {
      await removeTeamMember(teamMemberToDelete.id);

      toast({
        title: 'Team member removed',
        description: 'The team member has been removed successfully.',
      });

      // Close dialog and reset state
      setConfirmDeleteDialogOpen(false);
      setTeamMemberToDelete(null);

      // Refresh the team members list
      mutate();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove team member',
        variant: 'destructive',
      });
    }
  };

  const handleUserDelete = async () => {
    if (!userToDelete) return;

    setIsUserDeleting(true);
    console.log('Attempting to delete user:', userToDelete.id);

    try {
      // Log the request details
      console.log('Sending DELETE request to:', `/api/users/${userToDelete.id}`);

      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      // Try to get the response body regardless of status
      let responseBody;
      try {
        responseBody = await response.json();
        console.log('Response body:', responseBody);
      } catch (e) {
        console.log('Could not parse response as JSON:', e);
      }

      if (!response.ok) {
        // Special handling for users with associated data
        if (response.status === 409 && responseBody?.associatedData) {
          const { teamMembers, projects, tasks, attendanceRecords } = responseBody.associatedData;
          let detailMessage = 'Cannot delete user with associated data:\n';

          if (teamMembers > 0) detailMessage += `- ${teamMembers} team memberships\n`;
          if (projects > 0) detailMessage += `- ${projects} projects\n`;
          if (tasks > 0) detailMessage += `- ${tasks} tasks\n`;
          if (attendanceRecords > 0) detailMessage += `- ${attendanceRecords} attendance records\n`;

          detailMessage += '\nPlease remove these associations before deleting the user.';

          throw new Error(detailMessage);
        }

        throw new Error(responseBody?.error || `Failed to delete user (${response.status})`);
      }

      // Close dialog and reset state
      setIsUserDeleteDialogOpen(false);
      setUserToDelete(null);

      toast({
        title: 'User deleted',
        description: 'The user has been deleted successfully.',
      });

      // Refresh the users list
      console.log('Refreshing user list...');
      mutateUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUserDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-destructive">
        Error loading team members. Please try again.
      </div>
    );
  }

  if (teamMembers.length === 0) {
    // If we're still loading users, show a loading spinner
    if (isLoadingUsers) {
      return (
        <div className="flex justify-center p-4">
          <Spinner size="md" />
        </div>
      );
    }

    return (
      <div className="w-full">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>No team members found</AlertTitle>
          <AlertDescription>
            Team members are associated with projects.{' '}
            {canAddMembers ? (
              <span>Create a project first to add team members, or view all users below.</span>
            ) : (
              <span>Showing all users instead.</span>
            )}
          </AlertDescription>
        </Alert>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No users found matching your search criteria.
          </div>
        ) : (
          <div className="rounded-md border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || ''} alt={user.name || ''} />
                          <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role || 'user'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/profile/${user.id}`} className="cursor-pointer">
                              <UserCircle className="mr-2 h-4 w-4" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          {(canDeleteUsers || canManageUsers) && user.id !== session?.user?.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => confirmUserDelete(user)}
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
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search team members..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map(member => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user?.image || ''} alt={member.user?.name || ''} />
                      <AvatarFallback>{getUserInitials(member.user?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{member.user?.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={member.user?.role || 'user'} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${member.user?.id}`} className="cursor-pointer">
                          <UserCircle className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      {canDeleteTeamMembers && member.user?.id !== session?.user?.id && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => confirmDelete(member)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Remove Member
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Team Member Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              {teamMemberToDelete?.name || teamMemberToDelete?.email} from the team? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isRemoving}>
              {isRemoving ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Delete Confirmation Dialog */}
      <Dialog open={isUserDeleteDialogOpen} onOpenChange={setIsUserDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name || userToDelete?.email}? This
              action cannot be undone and will remove all data associated with this user.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsUserDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUserDelete} disabled={isUserDeleting}>
              {isUserDeleting ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
