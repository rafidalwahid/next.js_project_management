'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTeamMembers, useRemoveTeamMember } from '@/hooks/use-team-management';
import { useToast } from '@/hooks/use-toast';
import { useHasPermission } from '@/hooks/use-has-permission';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/role-badge';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TeamMembersFilter, TeamMembersFilters } from '@/components/team/team-members-filter';
import {
  Users,
  UserPlus,
  Trash,
  MoreHorizontal,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Briefcase,
  PlusCircle,
} from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EnhancedTeamMembersListProps {
  limit?: number;
  showFilters?: boolean;
}

export function EnhancedTeamMembersList({
  limit = 20,
  showFilters = true,
}: EnhancedTeamMembersListProps) {
  // State
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TeamMembersFilters>({
    search: '',
    projectId: null,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [teamMemberToDelete, setTeamMemberToDelete] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Hooks
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission: canDeleteTeamMembers } = useHasPermission('team_remove');
  const { hasPermission: canAddMembers } = useHasPermission('team_add');
  const { hasPermission: canCreateProject } = useHasPermission('project_create');

  // Fetch team members
  const { teamMembers, isLoading, isError, mutate } = useTeamMembers(
    filters.projectId || undefined,
    page,
    limit,
    filters.search
  );

  const { removeTeamMember, isRemoving } = useRemoveTeamMember();

  // Group team members by project and deduplicate users
  const groupedMembers = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return {};

    // Create a map to track unique users and their projects
    const userMap = new Map();

    // First pass: collect all projects for each user
    teamMembers.forEach(member => {
      if (!member.user?.id) return;

      const userId = member.user.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          ...member,
          projects: [member.project],
        });
      } else {
        const existingUser = userMap.get(userId);
        existingUser.projects.push(member.project);
      }
    });

    // Second pass: group by project
    const projectGroups: Record<string, any[]> = {};

    teamMembers.forEach(member => {
      if (!member.project?.id) return;

      const projectId = member.project.id;
      if (!projectGroups[projectId]) {
        projectGroups[projectId] = [];
      }

      // Check if this user is already in this project group
      const existingMember = projectGroups[projectId].find(m => m.user?.id === member.user?.id);

      if (!existingMember) {
        projectGroups[projectId].push({
          ...member,
          allProjects: userMap.get(member.user?.id)?.projects || [],
        });
      }
    });

    return projectGroups;
  }, [teamMembers]);

  // Initialize expanded state for projects
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    Object.keys(groupedMembers).forEach(projectId => {
      initialExpandedState[projectId] = true;
    });
    setExpandedProjects(initialExpandedState);
  }, []);

  // Helper functions
  const getUserInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
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

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Spinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="p-4 text-center text-destructive">
        Error loading team members. Please try again.
      </div>
    );
  }

  // Render empty state
  if (teamMembers.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title="No team members found"
        description={
          filters.search || filters.projectId
            ? 'No team members match your current filters. Try adjusting your search criteria.'
            : 'Team members are associated with projects. Create a project first to add team members.'
        }
        actions={
          <>
            {filters.search || filters.projectId ? (
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    search: '',
                    projectId: null,
                    sortBy: 'name',
                    sortOrder: 'asc',
                  })
                }
              >
                Clear Filters
              </Button>
            ) : canCreateProject ? (
              <Button asChild>
                <Link href="/projects/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/team/users">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
            )}
          </>
        }
      />
    );
  }

  // Render team members list
  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      {showFilters && <TeamMembersFilter filters={filters} onChange={setFilters} />}

      {/* Team Members List */}
      <div className="space-y-4">
        {Object.keys(groupedMembers).length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                No team members match your current filters.
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedMembers).map(([projectId, members]) => (
            <Card key={projectId} className="overflow-hidden">
              <Collapsible
                open={expandedProjects[projectId]}
                onOpenChange={() => toggleProjectExpanded(projectId)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-4 cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {members[0]?.project?.title || 'Unknown Project'}
                        </CardTitle>
                        <Badge variant="outline" className="ml-2">
                          {members.length} {members.length === 1 ? 'member' : 'members'}
                        </Badge>
                      </div>
                      {expandedProjects[projectId] ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Projects</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map(member => (
                          <TableRow key={`${projectId}-${member.user?.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={member.user?.image || ''}
                                    alt={member.user?.name || ''}
                                  />
                                  <AvatarFallback>
                                    {getUserInitials(member.user?.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {member.user?.name || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {member.user?.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <RoleBadge role={member.user?.role || 'user'} />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {member.allProjects?.map((project: any) => (
                                  <Badge
                                    key={project.id}
                                    variant={project.id === projectId ? 'default' : 'outline'}
                                    className="text-xs"
                                  >
                                    {project.title}
                                  </Badge>
                                ))}
                              </div>
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
                                    <Link
                                      href={`/profile/${member.user?.id}`}
                                      className="cursor-pointer"
                                    >
                                      <UserCircle className="mr-2 h-4 w-4" />
                                      View Profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/projects/${projectId}`}
                                      className="cursor-pointer"
                                    >
                                      <Briefcase className="mr-2 h-4 w-4" />
                                      View Project
                                    </Link>
                                  </DropdownMenuItem>
                                  {canDeleteTeamMembers &&
                                    member.user?.id !== session?.user?.id && (
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
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
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
