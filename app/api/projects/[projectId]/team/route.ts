import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

// GET handler to fetch team members for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } | Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    const isTeamMember = project.teamMembers.length > 0;
    const isAdmin = session.user.role === "admin";

    if (!isTeamMember && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to view this project's team" },
        { status: 403 }
      );
    }

    // Get all team members for the project
    const teamMembers = await prisma.teamMember.findMany({
      where: { projectId },
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
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error("Error fetching project team members:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching team members" },
      { status: 500 }
    );
  }
}

// Validation schema for adding a team member
const addTeamMemberSchema = z.object({
  userId: z.string(),
});

// POST handler to add a team member to a project
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } | Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to add team members
    const isTeamMember = project.teamMembers.length > 0;
    const isAdmin = session.user.role === "admin";

    if (!isTeamMember && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to add team members to this project" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = addTeamMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { userId } = validationResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a team member
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
        { error: "User is already a team member of this project" },
        { status: 400 }
      );
    }

    // Add user as a team member
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
            role: true,
          },
        },
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        action: "added_team_member",
        entityType: "project",
        entityId: projectId,
        description: `Added ${teamMember.user.name || teamMember.user.email} to the project team`,
        userId: session.user.id,
        projectId,
      },
    });

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "An error occurred while adding the team member" },
      { status: 500 }
    );
  }
}
