import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserTeamMemberships } from "@/lib/queries/team-queries";

interface Params {
  params: {
    userId: string;
  };
}

/**
 * GET /api/users/[userId]/teams
 * Get team memberships for a specific user
 */
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

    // Extract userId from params, ensuring it's properly awaited
    const { userId } = await Promise.resolve(params);

    // Check if user has permission to view this user's teams
    // Users can view their own teams, admins and managers can view any user's teams
    const isOwnProfile = session.user.id === userId;
    const isAdmin = session.user.role === 'admin';
    const isManager = session.user.role === 'manager';

    if (!isOwnProfile && !isAdmin && !isManager) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this user\'s team memberships' },
        { status: 403 }
      );
    }

    // Get URL parameters for pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Get team memberships for the user
    const result = await getUserTeamMemberships(userId, page, limit);

    // Format the response for the UserProjectRoles component
    const formattedTeamMemberships = result.teamMemberships.map(membership => ({
      id: membership.id,
      projectId: membership.project.id,
      projectTitle: membership.project.title,
      // Include other fields as needed by your UserProjectRoles component
    }));

    return NextResponse.json(formattedTeamMemberships);
  } catch (error: any) {
    console.error('Error fetching user team memberships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team memberships', details: error.message },
      { status: 500 }
    );
  }
}