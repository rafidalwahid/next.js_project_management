'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PermissionGuard } from '@/components/permission-guard';
import Link from 'next/link';
import { BarChart3, Save, X, AlertCircle } from 'lucide-react';
import { SYSTEM_ROLES, getRoleOptions } from '@/lib/roles';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardNav } from '@/components/dashboard-nav';
import { UserNav } from '@/components/user-nav';
import { useProjects } from '@/hooks/use-data';
import { useUsers } from '@/hooks/use-users';
import { teamManagementApi } from '@/lib/api';
import { useAddTeamMember } from '@/hooks/use-team-management';
import { useToast } from '@/hooks/use-toast';

export default function NewTeamMemberPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { projects, isLoading: projectsLoading, isError: projectsError } = useProjects(1, 100);
  const { users } = useUsers();
  const { toast } = useToast();

  // Debug projects data
  useEffect(() => {
    console.log('Projects data:', projects);
    console.log('Projects loading:', projectsLoading);
    console.log('Projects error:', projectsError);
  }, [projects, projectsLoading, projectsError]);

  // Check if user has permission to add team members
  useEffect(() => {
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'manager') {
      toast({
        title: 'Access Denied',
        description: "You don't have permission to add team members",
        variant: 'destructive',
      });
      router.push('/team');
    }
  }, [session, router, toast]);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    projectId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    projectId?: string;
  }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      projectId?: string;
    } = {};

    // Validate name
    if (!userData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate email
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!userData.password) {
      newErrors.password = 'Password is required';
    } else if (userData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Validate project
    if (!userData.projectId) {
      newErrors.projectId = 'Please select a project';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Use the addTeamMember hook
  const { addTeamMember, isAdding, error: addTeamMemberError } = useAddTeamMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the user via API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const createdUser = await response.json();

      // Now add the newly created user to the team using the new API
      await addTeamMember({
        userId: createdUser.id,
        projectId: userData.projectId,
      });

      toast({
        title: 'Team Member Created',
        description: `${userData.name} has been created and added to the project successfully.`,
        variant: 'default',
      });

      router.push('/team');
    } catch (error: any) {
      // Handle specific error cases
      if (error.message.includes('email already exists')) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add team member',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Team Member</h1>
        <p className="text-muted-foreground">
          Create a new user account and add them to a project team.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Add New Team Member</CardTitle>
            <CardDescription>Create a new user and add them to a project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    placeholder="Enter user's full name"
                    className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    placeholder="Enter user's email address"
                    className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={userData.password}
                    onChange={handleInputChange}
                    placeholder="Create a secure password"
                    className={`w-full ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">System Role</Label>
                  <Select
                    name="role"
                    defaultValue="user"
                    onValueChange={value => setUserData(prev => ({ ...prev, role: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{SYSTEM_ROLES.user.name}</SelectItem>
                      <PermissionGuard permission="user_management">
                        <SelectItem value="manager">{SYSTEM_ROLES.manager.name}</SelectItem>
                        <SelectItem value="admin">{SYSTEM_ROLES.admin.name}</SelectItem>
                      </PermissionGuard>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    This determines the user's permissions across the entire system.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="projectId">Assign to Project</Label>
                <Select
                  name="projectId"
                  onValueChange={value => setUserData(prev => ({ ...prev, projectId: value }))}
                  disabled={isSubmitting || projectsLoading}
                >
                  <SelectTrigger className={errors.projectId ? 'border-red-500' : ''}>
                    <SelectValue
                      placeholder={projectsLoading ? 'Loading projects...' : 'Select a project'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projectsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading projects...
                      </SelectItem>
                    ) : projectsError ? (
                      <SelectItem value="error" disabled>
                        Error loading projects
                      </SelectItem>
                    ) : Array.isArray(projects) && projects.length > 0 ? (
                      projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-projects" disabled>
                        No projects available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.projectId && <p className="text-sm text-red-500">{errors.projectId}</p>}
                <p className="text-sm text-muted-foreground mt-1">
                  The user will be added as a team member to this project.
                </p>
                {!projectsLoading &&
                  !projectsError &&
                  (Array.isArray(projects)
                    ? projects.length === 0
                    : !projects || !projects.projects || projects.projects.length === 0) && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                      <p>
                        No projects are available. Please create a project first before adding team
                        members.
                      </p>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-amber-800 underline"
                        asChild
                      >
                        <Link href="/projects/new">Create a project</Link>
                      </Button>
                    </div>
                  )}
              </div>
            </div>
            {/* Project role selection removed as we now only use system roles */}
          </CardContent>
          <CardFooter className="flex justify-end">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
              <Button
                variant="outline"
                asChild
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <Link href="/team">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Link>
              </Button>
              <Button
                type="submit"
                className="bg-black hover:bg-black/90 text-white w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Member
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
