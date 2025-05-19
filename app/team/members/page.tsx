'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserPlus, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useHasPermission } from '@/hooks/use-has-permission';
import { useProjects } from '@/hooks/use-data';

import { Button } from '@/components/ui/button';
import { ElegantTeamMembersList } from '@/components/team/elegant-team-members-list';
import { Spinner } from '@/components/ui/spinner';

/**
 * Team Members Page
 *
 * Displays a list of team members across all projects with filtering and sorting capabilities.
 * Provides actions for adding team members and creating projects based on user permissions.
 */
export default function TeamMembersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission: canAddMembers } = useHasPermission('team_add');
  const { hasPermission: canCreateProject } = useHasPermission('project_create');
  const { projects, isLoading: isLoadingProjects } = useProjects(1, 100);
  const hasProjects = projects && projects.length > 0;

  // Show loading state when checking auth
  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
        <h1 className="text-3xl font-bold">Team Members</h1>
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <main className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-muted-foreground mt-1">
              View and manage team members across all projects in your organization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canAddMembers && hasProjects && (
              <Button asChild>
                <Link href="/team/new">
                  <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Add Team Member</span>
                </Link>
              </Button>
            )}
            {canCreateProject && (
              <Button asChild variant={canAddMembers && hasProjects ? 'outline' : 'default'}>
                <Link href="/projects/new">
                  <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Create Project</span>
                </Link>
              </Button>
            )}
          </div>
        </header>

        {/* Team Members List */}
        <section aria-labelledby="team-members-heading">
          <h2 id="team-members-heading" className="sr-only">
            Team Members List
          </h2>
          <ElegantTeamMembersList limit={50} />
        </section>
      </div>
    </main>
  );
}
