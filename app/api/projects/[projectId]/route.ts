import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

// GET handler to fetch a specific project
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

    // Get the project with related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        statuses: true,
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
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

    // Check if user has access to the project
    const isTeamMember = project.teamMembers.some(
      (member) => member.userId === session.user.id
    );
    const isAdmin = session.user.role === "admin";

    if (!isTeamMember && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to view this project" },
        { status: 403 }
      );
    }

    // Format dates for the response
    const formattedProject = {
      ...project,
      startDate: project.startDate?.toISOString() || null,
      endDate: project.endDate?.toISOString() || null,
      dueDate: project.dueDate?.toISOString() || null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };

    return NextResponse.json({ project: formattedProject });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the project" },
      { status: 500 }
    );
  }
}

// Validation schema for updating a project
const updateProjectSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedTime: z.number().optional().nullable(),
  totalTimeSpent: z.number().optional().nullable(),
});

// PATCH handler to update a project
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } | Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check if project exists and user has access
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

    // Only project team members or admins can update the project
    const isTeamMember = project.teamMembers.length > 0;
    const isAdmin = session.user.role === "admin";

    if (!isTeamMember && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this project" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = updateProjectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      startDate,
      endDate,
      dueDate,
      estimatedTime,
      totalTimeSpent,
    } = validationResult.data;

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedTime,
        totalTimeSpent,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        statuses: true,
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
          },
        },
      },
    });

    // Format dates for the response
    const formattedProject = {
      ...updatedProject,
      startDate: updatedProject.startDate?.toISOString() || null,
      endDate: updatedProject.endDate?.toISOString() || null,
      dueDate: updatedProject.dueDate?.toISOString() || null,
      createdAt: updatedProject.createdAt.toISOString(),
      updatedAt: updatedProject.updatedAt.toISOString(),
    };

    return NextResponse.json({ project: formattedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the project" },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } | Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check if project exists and user has access
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

    // Only project creator or admins can delete the project
    const isCreator = project.createdById === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this project" },
        { status: 403 }
      );
    }

    // Delete the project (cascades to statuses, tasks, etc.)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the project" },
      { status: 500 }
    );
  }
}
