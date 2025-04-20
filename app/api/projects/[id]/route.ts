import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

interface Params {
  params: {
    id: string;
  };
}

// GET handler to get a project by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Next.js 14, params is a Promise that needs to be awaited
    const { id } = await params;

    // Get project with related data
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        status: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        events: true,
        resources: true,
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
            events: true,
            resources: true,
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
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
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  statusId: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// PATCH handler to update a project
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Next.js 14, params is a Promise that needs to be awaited
    const { id } = await params;
    const body = await req.json();

    // Validate request body
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        teamMembers: {
          where: {
            userId: session.user.id,
            role: { in: ["owner", "admin"] }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has permission to update
    if (project.createdById !== session.user.id && project.teamMembers.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to update this project" },
        { status: 403 }
      );
    }

    const { title, description, statusId, startDate, endDate } = validationResult.data;

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (statusId !== undefined) updateData.statusId = statusId;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        activities: {
          create: {
            action: "updated",
            entityType: "project",
            description: `Project was updated`,
            userId: session.user.id,
          }
        }
      },
      include: {
        status: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the project" },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a project
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Next.js 14, params is a Promise that needs to be awaited
    const { id } = await params;

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        teamMembers: {
          where: {
            userId: session.user.id,
            role: "owner"
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only project owner or creator can delete
    if (project.createdById !== session.user.id && project.teamMembers.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to delete this project" },
        { status: 403 }
      );
    }

    // Delete project and all related data (cascading delete)
    await prisma.project.delete({
      where: { id }
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