import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

/**
 * @deprecated This API endpoint is deprecated. Use /api/team-management/membership?projectId={projectId} instead.
 */

interface Params {
  params: {
    projectId: string;
  } | Promise<{ projectId: string }>;
}

/**
 * GET /api/projects/[projectId]/membership
 * Check if the current user is a member of the project
 * @deprecated Use /api/team-management/membership?projectId={projectId} instead
 */
export async function GET(_req: NextRequest, { params }: Params) {
  console.warn("This API endpoint is deprecated. Use /api/team-management/membership?projectId={projectId} instead.");
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In Next.js, params might be a promise that needs to be awaited
    const { projectId } = await params;

    // Check if the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if the user is an admin (admins have access to all projects)
    if (session.user.role === 'admin') {
      return NextResponse.json({
        isMember: true
      });
    }

    // Check if the user is the project creator
    const projectDetails = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (projectDetails?.createdById === session.user.id) {
      return NextResponse.json({
        isMember: true
      });
    }

    // Check if the user is a team member
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });

    const isMember = !!teamMember;

    return NextResponse.json({
      isMember
    });
  } catch (error: any) {
    console.error('Error checking project membership:', error);
    return NextResponse.json(
      { error: 'Failed to check project membership', details: error.message },
      { status: 500 }
    );
  }
}
