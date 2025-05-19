'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTeamMembers, useRemoveTeamMember } from '@/hooks/use-team-management';
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

  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission: canDeleteTeamMembers } = useHasPermission('team_remove');
  const { hasPermission: canAddMembers } = useHasPermission('team_add');

  const { teamMembers, isLoading, isError, mutate } = useTeamMembers(
    projectId,
    page,
    limit,
    searchQuery
  );

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
        description: "You don't have permission to remove team members.",
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
    return (
      <div className="w-full">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>No team members found</AlertTitle>
          <AlertDescription>
            Team members are associated with projects.{' '}
            {canAddMembers ? (
              <span>
                <Link href="/projects/new" className="underline">
                  Create a project
                </Link>{' '}
                first to add team members, or
                <Link href="/team/users" className="underline ml-1">
                  manage users
                </Link>{' '}
                in the user management section.
              </span>
            ) : (
              <span>Ask an administrator to create a project and add team members.</span>
            )}
          </AlertDescription>
        </Alert>
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
              <TableHead>Project</TableHead>
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
                <TableCell>
                  {member.project?.title ? (
                    <Link href={`/projects/${member.project.id}`} className="hover:underline">
                      {member.project.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Unknown project</span>
                  )}
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
                            Remove from Team
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
    </div>
  );
}
