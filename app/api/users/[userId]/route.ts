import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserById, updateUser } from '@/lib/queries/user-queries';

interface Params {
  params: {
    userId: string;
  };
}

// GET /api/users/[userId] - Get a specific user by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;
    const isProfile = req.nextUrl.searchParams.get('profile') === 'true';

    // Check if user has permission to view this user
    // Users can view their own profile, admins can view any profile
    const isOwnProfile = session.user.id === userId;
    const isAdmin = session.user.role === 'admin';
    const isManager = session.user.role === 'manager';

    if (!isOwnProfile && !isAdmin && !isManager) {
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
          updatedAt: true
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
          project: {
            select: {
              id: true,
              title: true
            }
          }
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

      // Return the user with additional profile data
      return NextResponse.json({
        user,
        projects,
        tasks,
        activities,
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
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Check if user has permission to update this user
    // Users can update their own profile, admins can update any profile
    const isOwnProfile = session.user.id === userId;
    const isAdmin = session.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this user' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    // If trying to change role, only admins can do that
    if (body.role && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can change user roles' },
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
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Only admins can delete users
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can delete users' },
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
