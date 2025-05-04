import prisma from "@/lib/prisma";
import { cache } from "react";

/**
 * Get team members for a project with pagination
 * @deprecated Use teamManagementApi.getTeamMembers instead
 */
export const getTeamMembers = cache(async (
  projectId?: string,
  page = 1,
  limit = 10,
  search?: string
) => {
  console.warn("getTeamMembers is deprecated. Use teamManagementApi.getTeamMembers instead.");
  try {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    // Role filtering removed

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.teamMember.count({ where });

    // Get team members with user details
    const teamMembers = await prisma.teamMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add task count for each team member
    const teamMembersWithTaskCount = await Promise.all(
      teamMembers.map(async (member) => {
        const taskCount = await prisma.taskAssignee.count({
          where: {
            userId: member.userId,
            task: {
              projectId: member.projectId,
            },
          },
        });

        return {
          ...member,
          taskCount,
        };
      })
    );

    return {
      teamMembers: teamMembersWithTaskCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error getting team members:", error);
    return {
      teamMembers: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
      },
    };
  }
});

/**
 * Get a team member by ID
 * @deprecated Use teamManagementApi.getTeamMember instead
 */
export const getTeamMember = cache(async (id: string) => {
  console.warn("getTeamMember is deprecated. Use teamManagementApi.getTeamMember instead.");
  try {
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!teamMember) {
      return null;
    }

    // Get task count
    const taskCount = await prisma.taskAssignee.count({
      where: {
        userId: teamMember.userId,
        task: {
          projectId: teamMember.projectId,
        },
      },
    });

    return {
      ...teamMember,
      taskCount,
    };
  } catch (error) {
    console.error("Error getting team member:", error);
    return null;
  }
});

/**
 * Get team members for a user
 * @deprecated Use teamManagementApi.getUserTeamMemberships instead
 */
export const getUserTeamMemberships = cache(async (
  userId: string,
  page = 1,
  limit = 10
) => {
  console.warn("getUserTeamMemberships is deprecated. Use teamManagementApi.getUserTeamMemberships instead.");
  try {
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.teamMember.count({
      where: { userId },
    });

    // Get team memberships with project details
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add task count for each project
    const membershipsWithTaskCount = await Promise.all(
      teamMemberships.map(async (membership) => {
        const taskCount = await prisma.taskAssignee.count({
          where: {
            userId,
            task: {
              projectId: membership.projectId,
            },
          },
        });

        return {
          ...membership,
          taskCount,
        };
      })
    );

    return {
      teamMemberships: membershipsWithTaskCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error getting user team memberships:", error);
    return {
      teamMemberships: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
      },
    };
  }
});

/**
 * Check if a user is a member of a project
 * @deprecated Use teamManagementApi.checkProjectMembership instead
 */
export const isUserProjectMember = cache(async (
  userId: string,
  projectId: string
) => {
  console.warn("isUserProjectMember is deprecated. Use teamManagementApi.checkProjectMembership instead.");
  try {
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return !!teamMember;
  } catch (error) {
    console.error("Error checking if user is project member:", error);
    return false;
  }
});
