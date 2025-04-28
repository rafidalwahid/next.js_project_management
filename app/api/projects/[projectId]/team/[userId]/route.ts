import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

// DELETE handler to remove a team member from a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, userId } = params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: true,
        createdBy: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to remove team members
    const isCreator = project.createdById === session.user.id;
    const isAdmin = session.user.role === "admin";
    const isSelf = userId === session.user.id;

    if (!isCreator && !isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "You don't have permission to remove team members from this project" },
        { status: 403 }
      );
    }

    // Check if user is a team member
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "User is not a team member of this project" },
        { status: 404 }
      );
    }

    // Prevent removing the project creator
    if (userId === project.createdById && !isAdmin) {
      return NextResponse.json(
        { error: "Cannot remove the project creator" },
        { status: 403 }
      );
    }

    // Remove user from the team
    await prisma.teamMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        action: "removed_team_member",
        entityType: "project",
        entityId: projectId,
        description: `Removed ${teamMember.user.name || teamMember.user.email} from the project team`,
        userId: session.user.id,
        projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "An error occurred while removing the team member" },
      { status: 500 }
    );
  }
}
