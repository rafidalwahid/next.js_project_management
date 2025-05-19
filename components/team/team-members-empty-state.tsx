'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserPlus, Users } from 'lucide-react';

interface TeamMembersEmptyStateProps {
  hasFilters: boolean;
  canCreateProject: boolean;
  onClearFilters: () => void;
}

/**
 * A memoized component for displaying an empty state when no team members are found
 */
export const TeamMembersEmptyState = memo(function TeamMembersEmptyState({
  hasFilters,
  canCreateProject,
  onClearFilters,
}: TeamMembersEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="bg-muted/30 rounded-full p-4 mb-4">
        <Users className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium mb-2">No team members found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {hasFilters
          ? 'No team members match your current filters.'
          : 'Team members are associated with projects. Create a project first to add team members.'}
      </p>
      <div className="flex gap-3">
        {hasFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        ) : canCreateProject ? (
          <Button asChild variant="default">
            <Link href="/projects/new">
              <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Project
            </Link>
          </Button>
        ) : (
          <Button asChild variant="default">
            <Link href="/team/users">
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Manage Users
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
});
