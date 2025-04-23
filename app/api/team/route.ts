import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { checkProjectTeamPermission } from "@/lib/permissions/team-permissions";
import { logActivity } from "@/lib/activity-logger";

// Validation schema for creating/updating team members
const teamMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
  role: z.enum(["owner", "admin", "manager", "member"]).default("member"),
});

// GET /api/team - Get team members with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    // For regular users, only show team members from projects they're part of
    // Admins and managers can see all team members
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      // Get projects the user is part of
      const userProjects = await prisma.teamMember.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          projectId: true,
        },
      });

      const userProjectIds = userProjects.map(p => p.projectId);

      if (projectId) {
        // If a specific project is requested, check if user is part of it
        if (!userProjectIds.includes(projectId)) {
          return NextResponse.json(
            { error: 'You do not have access to this project' },
            { status: 403 }
          );
        }
      } else {
        // If no specific project, limit to user's projects
        where.projectId = {
          in: userProjectIds,
        };
      }
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

    // Return team members with pagination
    return NextResponse.json({
      teamMembers: teamMembersWithTaskCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/team - Add a team member
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate request body
    const validationResult = teamMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { userId, projectId, role } = validationResult.data;

    // Check if the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the current user has permission to add team members to this project
    const { hasPermission, error } = await checkProjectTeamPermission(projectId, session, 'add');

    if (!hasPermission) {
      return NextResponse.json(
        { error },
        { status: 403 }
      );
    }

    // Check if the team member already exists
    const existingTeamMember = await prisma.teamMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingTeamMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      );
    }

    // Create the team member
    const teamMember = await prisma.teamMember.create({
      data: {
        userId,
        projectId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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

    // Create activity record
    await logActivity({
      userId: session.user.id,
      action: 'create',
      entityType: 'TeamMember',
      entityId: teamMember.id,
      description: `${session.user.name || 'User'} added ${user.name || 'a user'} to project ${project.title}`,
      projectId
    });

    return NextResponse.json(teamMember);
  } catch (error: any) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add team member', details: error.message },
      { status: 500 }
    );
  }
}
