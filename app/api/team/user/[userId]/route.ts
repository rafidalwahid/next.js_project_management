import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserTeamMemberships } from "@/lib/queries/team-queries";

interface Params {
  params: {
    userId: string;
  } | Promise<{ userId: string }>;
}

// GET /api/team/user/[userId] - Get team memberships for a user
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

    // In Next.js App Router, params might be a promise that needs to be awaited
    const { userId } = await params;

    // Check if user has permission to view this user's team memberships
    // Users can view their own team memberships, admins can view any user's team memberships
    const isOwnProfile = session.user.id === userId;
    const isAdmin = session.user.role === 'admin';
    const isManager = session.user.role === 'manager';

    if (!isOwnProfile && !isAdmin && !isManager) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this user\'s team memberships' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get team memberships for the user
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${teamMemberships.length} team memberships for user ${userId}`);

    // Transform the data to match what the frontend expects
    const formattedTeamMemberships = teamMemberships.map(membership => ({
      id: membership.id,
      projectId: membership.projectId,
      projectTitle: membership.project.title,
      description: membership.project.description,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt
    }));

    return NextResponse.json(formattedTeamMemberships);
  } catch (error: any) {
    console.error('Error in team/user/[userId] endpoint:', error);

    // Instead of returning an error response, return an empty array
    // This prevents UI errors and provides graceful degradation
    console.log('Returning empty array due to error');
    return NextResponse.json([]);
  }
}
