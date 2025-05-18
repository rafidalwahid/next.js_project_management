'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useHasPermission } from '@/hooks/use-has-permission';
import { useProjects } from '@/hooks/use-data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamMembersList } from '@/components/team/team-members-list';
import { Spinner } from '@/components/ui/spinner';

export default function TeamMembersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission: canAddMembers } = useHasPermission('team_add');
  const { projects, isLoading: isLoadingProjects } = useProjects(1, 1); // Just check if any projects exist
  const hasProjects = projects && projects.length > 0;

  // Show loading state when checking auth
  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
        <div className="flex items-center gap-2">
          {canAddMembers && (
            <Link href="/team/new">
              <Button className="bg-black hover:bg-black/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add New Member
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="shadow-xs border-0">
        <CardHeader className="pb-3">
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            View and manage team members in your organization.
            {!hasProjects && !isLoadingProjects && (
              <p className="mt-2 text-amber-600">
                Note: Team members are associated with projects. {canAddMembers ? (
                  <Link href="/projects/new" className="underline">Create a project</Link>
                ) : (
                  <span>Ask an admin to create a project</span>
                )} to add team members.
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersList limit={20} />
        </CardContent>
      </Card>
    </div>
  );
}
