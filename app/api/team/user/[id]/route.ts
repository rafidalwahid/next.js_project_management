import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

interface Params {
  params: {
    id: string;
  } | Promise<{ id: string }>;
}

/**
 * GET /api/team/user/[id] - Get all team memberships for a user
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
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the current user is requesting their own data or is an admin
    const isOwnData = session.user.id === id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isOwnData && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied: You can only view your own team memberships or you need admin privileges' },
        { status: 403 }
      );
    }

    // Get all team memberships for the user with project details
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        project: {
          title: 'asc',
        },
      },
    });

    // Transform the data to a more convenient format
    const formattedMemberships = teamMemberships.map(membership => ({
      id: membership.id,
      projectId: membership.projectId,
      projectTitle: membership.project.title,
      role: membership.role,
    }));

    return NextResponse.json(formattedMemberships);
  } catch (error: any) {
    console.error('Error fetching user team memberships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team memberships', details: error.message },
      { status: 500 }
    );
  }
}
