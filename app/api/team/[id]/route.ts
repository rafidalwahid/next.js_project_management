import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { checkTeamMemberPermission } from "@/lib/permissions/team-permissions";
import { logActivity } from "@/lib/activity-logger";

interface Params {
  params: {
    id: string;
  } | Promise<{ id: string }>;
}

// Validation schema for updating team members
const updateTeamMemberSchema = z.object({
  role: z.enum(["owner", "admin", "manager", "member"]).optional(),
});

// GET /api/team/[id] - Get a team member by ID
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In Next.js, params might be a promise that needs to be awaited
    const { id } = await params;

    // Check permission and get team member
    const { hasPermission, teamMember, error } = await checkTeamMemberPermission(id, session, 'view');

    if (!hasPermission) {
      return NextResponse.json(
        { error },
        { status: error === "Team member not found" ? 404 : 403 }
      );
    }

    // Add task count for the team member
    const taskCount = await prisma.taskAssignee.count({
      where: {
        userId: teamMember.userId,
        task: {
          projectId: teamMember.projectId,
        },
      },
    });

    return NextResponse.json({
      ...teamMember,
      taskCount,
    });
  } catch (error: any) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/team/[id] - Update a team member
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In Next.js, params might be a promise that needs to be awaited
    const { id } = await params;
    const body = await req.json();

    // Validate request body
    const validationResult = updateTeamMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Check permission and get team member
    const { hasPermission, teamMember, error } = await checkTeamMemberPermission(id, session, 'update');

    if (!hasPermission) {
      return NextResponse.json(
        { error },
        { status: error === "Team member not found" ? 404 : 403 }
      );
    }

    // Log the permission check success
    console.log(`User ${session.user.id} granted permission to update team member ${id}`);

    // Log the action
    await logActivity({
      userId: session.user.id,
      action: 'permission_granted',
      entityType: 'TeamMember',
      entityId: id,
      description: `Permission granted: User allowed to update team member ${teamMember.user.name || 'Unknown'}`,
      projectId: teamMember.projectId
    });

    // Update the team member
    const updatedTeamMember = await prisma.teamMember.update({
      where: { id },
      data: validationResult.data,
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
    if (body.role && body.role !== teamMember.role) {
      await logActivity({
        userId: session.user.id,
        action: 'update_role',
        entityType: 'TeamMember',
        entityId: teamMember.id,
        description: `${session.user.name || 'User'} changed ${teamMember.user.name || 'user'}'s role from ${teamMember.role} to ${body.role}`,
        projectId: teamMember.projectId
      });
    }

    return NextResponse.json(updatedTeamMember);
  } catch (error: any) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/team/[id] - Remove a team member
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In Next.js, params might be a promise that needs to be awaited
    const { id } = await params;

    // Check permission and get team member
    const { hasPermission, teamMember, error } = await checkTeamMemberPermission(id, session, 'delete');

    if (!hasPermission) {
      return NextResponse.json(
        { error },
        { status: error === "Team member not found" ? 404 : 403 }
      );
    }

    // Delete the team member
    await prisma.teamMember.delete({
      where: { id },
    });

    // Create activity record
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'TeamMember',
      entityId: id,
      description: `${session.user.name || 'User'} removed ${teamMember.user.name || 'a user'} from project ${teamMember.project.title}`,
      projectId: teamMember.projectId
    });

    return NextResponse.json({
      message: 'Team member removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member', details: error.message },
      { status: 500 }
    );
  }
}
