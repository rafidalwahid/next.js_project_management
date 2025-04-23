import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserProjectRole } from "@/lib/queries/team-queries";

interface Params {
  params: {
    id: string;
  } | Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/membership
 * Check if the current user is a member of the project
 */
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
    
    // Check if the project exists
    const project = await prisma.project.findUnique({
      where: { id },
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
        isMember: true,
        role: 'admin',
      });
    }

    // Check if the user is the project creator
    const projectDetails = await prisma.project.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (projectDetails?.createdById === session.user.id) {
      return NextResponse.json({
        isMember: true,
        role: 'owner',
      });
    }

    // Check if the user is a team member
    const role = await getUserProjectRole(session.user.id, id);
    
    return NextResponse.json({
      isMember: !!role,
      role,
    });
  } catch (error: any) {
    console.error('Error checking project membership:', error);
    return NextResponse.json(
      { error: 'Failed to check project membership', details: error.message },
      { status: 500 }
    );
  }
}
