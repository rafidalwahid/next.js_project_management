import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserById, updateUser } from '@/lib/queries/user-queries';
import { PermissionService } from "@/lib/permissions/unified-permission-service";
import { ApiRouteHandlerOneParam, getParams } from "@/lib/api-route-types";

// GET /api/users/[userId] - Get a specific user by ID
export const GET: ApiRouteHandlerOneParam<'userId'> = async (
  req,
  { params }
) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract userId from params safely
    const resolvedParams = await getParams(params);
    const { userId } = resolvedParams;
    const isProfile = req.nextUrl.searchParams.get('profile') === 'true';

    // Check if user has permission to view this user
    // Users can view their own profile, users with user_management permission can view any profile
    const isOwnProfile = session.user.id === userId;
    const hasUserManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      "user_management"
    );

    if (!isOwnProfile && !hasUserManagementPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this user' },
        { status: 403 }
      );
    }

    // Get the user
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If this is a profile request, include additional data
    if (isProfile) {
      // Get projects the user is a member of
      const projects = await prisma.project.findMany({
        where: {
          teamMembers: {
            some: {
              userId: userId
            }
          }
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          startDate: true,
          endDate: true,
          statuses: {
            where: {
              isDefault: true
            },
            select: {
              id: true,
              name: true,
              color: true,
              description: true,
              isDefault: true
            },
            take: 1
          },
          teamMembers: {
            where: {
              userId: userId
            },
            select: {
              createdAt: true
            },
            take: 1
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 5 // Limit to 5 most recent projects
      });

      // Get tasks assigned to the user
      const tasks = await prisma.task.findMany({
        where: {
          assignees: {
            some: {
              userId: userId
            }
          }
        },
        select: {
          id: true,
          title: true,
          priority: true,
          completed: true,
          dueDate: true,
          status: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          project: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 10 // Limit to 10 most recent tasks
      });

      // Get user's recent activities
      const activities = await prisma.activity.findMany({
        where: {
          userId: userId
        },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          createdAt: true,
          project: {
            select: {
              id: true,
              title: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20 // Limit to 20 most recent activities
      });

      // Calculate stats
      const projectCount = await prisma.teamMember.count({
        where: { userId }
      });

      const taskCount = await prisma.taskAssignee.count({
        where: { userId }
      });

      // Count team members the user has worked with
      // Using a simpler approach to avoid Prisma validation errors
      const teamProjects = await prisma.teamMember.findMany({
        where: { userId },
        select: { projectId: true }
      });

      // Get the project IDs the user is a member of
      const projectIds = teamProjects.map(tm => tm.projectId);

      // Count team members in those projects (excluding the user)
      let teamCount = 0;
      if (projectIds.length > 0) {
        teamCount = await prisma.teamMember.count({
          where: {
            projectId: { in: projectIds },
            userId: { not: userId }
          }
        });
      }

      // Calculate completion rate
      const completedTasksCount = await prisma.task.count({
        where: {
          assignees: {
            some: { userId }
          },
          completed: true
        }
      });

      const totalTasksCount = await prisma.task.count({
        where: {
          assignees: {
            some: { userId }
          }
        }
      });

      const completionRate = totalTasksCount > 0
        ? `${Math.round((completedTasksCount / totalTasksCount) * 100)}%`
        : '0%';

      console.log('Raw projects data:', JSON.stringify(projects, null, 2));
      console.log('Raw tasks data:', JSON.stringify(tasks, null, 2));

      // Check if the user has any team memberships directly
      const teamMemberships = await prisma.teamMember.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              startDate: true,
              endDate: true,
              statuses: {
                where: { isDefault: true },
                select: {
                  id: true,
                  name: true,
                  color: true,
                  description: true,
                  isDefault: true
                },
                take: 1
              },
              tasks: {
                where: {
                  assignees: {
                    some: {
                      userId: userId
                    }
                  }
                },
                select: {
                  id: true,
                  title: true,
                  priority: true,
                  completed: true,
                  dueDate: true,
                  status: {
                    select: {
                      id: true,
                      name: true,
                      color: true
                    }
                  }
                },
                take: 5
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('Team memberships:', JSON.stringify(teamMemberships, null, 2));

      // Check if the user has any task assignments directly
      const taskAssignments = await prisma.taskAssignee.findMany({
        where: { userId },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              completed: true,
              dueDate: true,
              startDate: true,
              endDate: true,
              status: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              },
              project: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  statuses: {
                    where: { isDefault: true },
                    select: {
                      id: true,
                      name: true,
                      color: true
                    },
                    take: 1
                  }
                }
              },
              subtasks: {
                select: {
                  id: true,
                  title: true,
                  completed: true
                },
                take: 3
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      console.log('Task assignments:', JSON.stringify(taskAssignments, null, 2));

      // Combine projects from team memberships with the original projects query
      const allProjects = [
        ...projects,
        ...teamMemberships.map(tm => ({
          id: tm.project.id,
          title: tm.project.title,
          description: tm.project.description,
          startDate: tm.project.startDate,
          endDate: tm.project.endDate,
          statuses: tm.project.statuses,
          teamMembers: [{ createdAt: tm.createdAt }],
          createdAt: new Date()
        }))
      ];

      // Remove duplicates
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      );

      // Transform projects data to match the expected format for UserProfileProjects
      const formattedProjects = uniqueProjects.map(project => ({
        id: project.id,
        title: project.title,
        status: project.statuses?.[0] || { id: 'unknown', name: 'Unknown', color: '#6E56CF', isDefault: true },
        startDate: project.startDate,
        endDate: project.endDate,
        role: 'Member', // Default role
        joinedAt: project.teamMembers?.[0]?.createdAt || project.createdAt
      }));

      // Combine tasks from task assignments with the original tasks query
      const allTasks = [
        ...tasks,
        ...taskAssignments.map(ta => ({
          id: ta.task.id,
          title: ta.task.title,
          priority: ta.task.priority,
          completed: ta.task.completed,
          dueDate: ta.task.dueDate,
          status: ta.task.status,
          project: ta.task.project
        }))
      ];

      // Remove duplicates
      const uniqueTasks = allTasks.filter((task, index, self) =>
        index === self.findIndex(t => t.id === task.id)
      );

      // Transform tasks data to match the expected format for UserProfileTasks
      const formattedTasks = uniqueTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.completed ? 'completed' : (task.status?.name?.toLowerCase() || 'in-progress'),
        priority: task.priority,
        dueDate: task.dueDate,
        project: task.project
      }));

      console.log('Formatted projects:', JSON.stringify(formattedProjects, null, 2));
      console.log('Formatted tasks:', JSON.stringify(formattedTasks, null, 2));

      // Return the user with additional profile data
      return NextResponse.json({
        user,
        projects: formattedProjects,
        tasks: formattedTasks,
        activities,
        teamMemberships: teamMemberships.map(tm => ({
          id: tm.id,
          projectId: tm.project.id,
          projectTitle: tm.project.title,
          projectStatus: tm.project.statuses?.[0] || null,
          joinedAt: tm.createdAt
        })),
        stats: {
          projectCount,
          taskCount,
          teamCount,
          completionRate
        }
      });
    }

    // Return just the user data for non-profile requests
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[userId] - Update a user
export const PATCH: ApiRouteHandlerOneParam<'userId'> = async (req, { params }) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }    // Extract userId from params safely
    const resolvedParams = await getParams(params);
    const { userId } = resolvedParams;

    // Check if user has permission to update this user
    // Users can update their own profile, users with user_management permission can update any profile
    const isOwnProfile = session.user.id === userId;
    const hasUserManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      "user_management"
    );

    if (!isOwnProfile && !hasUserManagementPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this user' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    // If trying to change role, only users with manage_roles permission can do that
    const hasManageRolesPermission = await PermissionService.hasPermissionById(
      session.user.id,
      "manage_roles"
    );

    if (body.role && !hasManageRolesPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to change user roles' },
        { status: 403 }
      );
    }

    // Update the user
    const updatedUser = await updateUser(userId, body);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId] - Delete a user
export const DELETE: ApiRouteHandlerOneParam<'userId'> = async (req, { params }) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract userId from params safely
    const resolvedParams = await getParams(params);
    const { userId } = resolvedParams;

    // Only users with user_management permission can delete users
    const hasUserManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      "user_management"
    );

    if (!hasUserManagementPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete users' },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}
