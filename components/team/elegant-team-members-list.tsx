'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTeamMembers, useRemoveTeamMember } from '@/hooks/use-team-management';
import { useToast } from '@/hooks/use-toast';
import { useHasPermission } from '@/hooks/use-has-permission';
import { useProjects } from '@/hooks/use-data';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Import our extracted components
import { TeamMembersFilters } from './team-members-filters';
import { TeamMemberRow } from './team-member-row';
import { TeamMembersEmptyState } from './team-members-empty-state';
import { DeleteTeamMemberDialog } from './delete-team-member-dialog';

// Import our type definitions
import {
  DeleteConfirmation,
  TeamMembersFilters as FiltersType,
  TeamMemberWithProjects,
} from './team-types';

interface ElegantTeamMembersListProps {
  limit?: number;
}

/**
 * An optimized component for displaying and managing team members
 * Features:
 * - Filtering and sorting
 * - Deduplication of team members across projects
 * - Deletion confirmation
 * - Accessibility support
 */
export function ElegantTeamMembersList({ limit = 50 }: ElegantTeamMembersListProps) {
  // State for pagination, filters, and deletion
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    projectId: null,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [teamMemberToDelete, setTeamMemberToDelete] = useState<DeleteConfirmation | null>(null);

  // Hooks for data and permissions
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission: canDeleteTeamMembers } = useHasPermission('team_remove');
  const { hasPermission: canCreateProject } = useHasPermission('project_create');
  const { projects } = useProjects(1, 100);

  // Fetch team members with current filters
  const { teamMembers, isLoading, isError, mutate } = useTeamMembers(
    filters.projectId || undefined,
    page,
    limit,
    filters.search
  );

  // Hook for removing team members
  const { removeTeamMember, isRemoving } = useRemoveTeamMember();

  /**
   * Process team members to remove duplicates and add project information
   * This is an expensive operation, so we memoize it
   */
  const processedMembers = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return [];

    // Create a map to track unique users
    const userMap = new Map<string, TeamMemberWithProjects>();

    // First pass: collect all projects for each user
    teamMembers.forEach(member => {
      if (!member.user?.id || !member.project) return;

      const userId = member.user.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          ...member,
          projects: [member.project],
        });
      } else {
        const existingUser = userMap.get(userId)!;
        if (!existingUser.projects.some(p => p?.id === member.project?.id)) {
          existingUser.projects.push(member.project);
        }
      }
    });

    // Convert map to array
    return Array.from(userMap.values());
  }, [teamMembers]);

  /**
   * Sort processed members based on current sort settings
   */
  const sortedMembers = useMemo(() => {
    if (!processedMembers.length) return [];

    return [...processedMembers].sort((a, b) => {
      let comparison = 0;

      // Sort by the selected field
      if (filters.sortBy === 'name') {
        comparison = (a.user?.name || '').localeCompare(b.user?.name || '');
      } else if (filters.sortBy === 'role') {
        comparison = (a.user?.role || '').localeCompare(b.user?.role || '');
      } else if (filters.sortBy === 'project') {
        comparison = (a.projects[0]?.title || '').localeCompare(b.projects[0]?.title || '');
      }

      // Apply sort direction
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [processedMembers, filters.sortBy, filters.sortOrder]);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters(newFilters);
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      projectId: null,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, []);

  /**
   * Prepare for team member deletion
   */
  const confirmDelete = useCallback(
    (member: TeamMemberWithProjects) => {
      if (!canDeleteTeamMembers) {
        toast({
          title: 'Permission Denied',
          description: "You don't have permission to remove team members.",
          variant: 'destructive',
        });
        return;
      }

      setTeamMemberToDelete({
        id: member.id,
        name: member.user?.name || null,
        email: member.user?.email || '',
      });
      setConfirmDeleteDialogOpen(true);
    },
    [canDeleteTeamMembers, toast]
  );

  /**
   * Handle team member deletion
   */
  const handleDelete = useCallback(async () => {
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
  }, [teamMemberToDelete, removeTeamMember, toast, mutate]);

  /**
   * Close the delete confirmation dialog
   */
  const closeDeleteDialog = useCallback(() => {
    setConfirmDeleteDialogOpen(false);
    setTeamMemberToDelete(null);
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" aria-live="polite" aria-busy="true">
        <Spinner size="lg" className="text-primary/50" />
        <span className="sr-only">Loading team members...</span>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div
        className="flex justify-center items-center py-12 text-muted-foreground"
        role="alert"
        aria-live="assertive"
      >
        Error loading team members. Please try again.
      </div>
    );
  }

  // Render empty state
  if (teamMembers.length === 0) {
    return (
      <TeamMembersEmptyState
        hasFilters={!!filters.search || !!filters.projectId}
        canCreateProject={canCreateProject}
        onClearFilters={clearFilters}
      />
    );
  }

  // Render team members list
  return (
    <div className="space-y-6">
      {/* Filters */}
      <TeamMembersFilters
        filters={filters}
        projects={projects}
        onFiltersChange={handleFiltersChange}
      />

      {/* Team Members Table */}
      <div
        className="rounded-md border border-muted/50 overflow-hidden bg-background"
        role="region"
        aria-label="Team members list"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium">Role</TableHead>
              <TableHead className="font-medium">Projects</TableHead>
              <TableHead className="text-right font-medium w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMembers.map(member => (
              <TeamMemberRow
                key={member.user?.id}
                member={member}
                currentUserId={session?.user?.id}
                canDeleteTeamMembers={canDeleteTeamMembers}
                onDeleteClick={confirmDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteTeamMemberDialog
        isOpen={confirmDeleteDialogOpen}
        isDeleting={isRemoving}
        teamMemberToDelete={teamMemberToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}
