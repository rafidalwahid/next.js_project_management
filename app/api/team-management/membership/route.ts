import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { withAuth } from "@/lib/api-middleware";

/**
 * GET /api/team-management/membership?projectId={projectId}
 * Check if the current user is a member of a project
 */
export const GET = withAuth(async (req: NextRequest, context: any, session: any) => {
  try {
    // Get projectId from query params
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user is a team member of the project
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
      select: { id: true },
    });

    // Check if user is an admin (admins have access to all projects)
    const isAdmin = session.user.role === "admin";

    // Return membership status
    return NextResponse.json({
      isMember: !!teamMember || isAdmin,
    });
  } catch (error) {
    console.error("Error checking project membership:", error);
    return NextResponse.json(
      { error: "An error occurred while checking project membership" },
      { status: 500 }
    );
  }
});
