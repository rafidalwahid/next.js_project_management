import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { checkProjectTeamPermission } from "@/lib/permissions/team-permissions.simplified";
import { logActivity } from "@/lib/activity-logger";

// Validation schema for creating team members (no role field)
const teamMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
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
    const search = searchParams.get('search') || '';

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

    // Add search filter if provided
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Get team members with pagination
    const [teamMembers, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true, // Include system role
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.teamMember.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;
    const hasPrevious = page > 1;

    return NextResponse.json({
      teamMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
        hasPrevious,
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

    const { userId, projectId } = validationResult.data;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
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

    // Create the team member (no role field)
    const teamMember = await prisma.teamMember.create({
      data: {
        userId,
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true, // Include system role
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
