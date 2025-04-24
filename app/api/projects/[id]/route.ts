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

    // Get the ID from params
    const { id } = params;

    // Get project with related data
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        status: true, // Primary status
        statuses: { // All statuses
          include: {
            status: true
          }
        },
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
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
            events: true,
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
  statusIds: z.array(z.string()).optional(), // Multiple status IDs
  addStatusIds: z.array(z.string()).optional(), // Status IDs to add
  removeStatusIds: z.array(z.string()).optional(), // Status IDs to remove
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

    // Get the ID from params
    const { id } = params;
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

    const { title, description, statusId, statusIds, addStatusIds, removeStatusIds, startDate, endDate } = validationResult.data;

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (statusId !== undefined) updateData.statusId = statusId;

    // Handle date fields with better null checking
    if (startDate !== undefined) {
      updateData.startDate = startDate && startDate.trim() !== "" ? new Date(startDate) : null;
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate && endDate.trim() !== "" ? new Date(endDate) : null;
    }

    console.log('Date fields:', {
      startDateInput: startDate,
      endDateInput: endDate,
      startDateFormatted: updateData.startDate,
      endDateFormatted: updateData.endDate
    });

    // Log the update data
    console.log('Updating project with data:', updateData);

    // Handle status updates if needed
    if (statusId || statusIds || addStatusIds || removeStatusIds) {
      // If primary status is changing
      if (statusId) {
        // Update the primary status link to not be primary
        await prisma.projectStatusLink.updateMany({
          where: {
            projectId: id,
            isPrimary: true
          },
          data: { isPrimary: false }
        });

        // Check if this status already exists as a link
        const existingLink = await prisma.projectStatusLink.findUnique({
          where: {
            projectId_statusId: {
              projectId: id,
              statusId: statusId
            }
          }
        });

        if (existingLink) {
          // Update existing link to be primary
          await prisma.projectStatusLink.update({
            where: { id: existingLink.id },
            data: { isPrimary: true }
          });
        } else {
          // Create new primary status link
          await prisma.projectStatusLink.create({
            data: {
              projectId: id,
              statusId: statusId,
              isPrimary: true
            }
          });
        }
      }

      // If replacing all statuses with new set
      if (statusIds) {
        // Delete all existing status links
        await prisma.projectStatusLink.deleteMany({
          where: { projectId: id }
        });

        // Create new status links
        for (const sId of statusIds) {
          await prisma.projectStatusLink.create({
            data: {
              projectId: id,
              statusId: sId,
              isPrimary: sId === statusId // Mark as primary if it matches the primary statusId
            }
          });
        }
      }

      // If adding specific statuses
      if (addStatusIds && addStatusIds.length > 0) {
        for (const sId of addStatusIds) {
          // Check if this status already exists
          const existingLink = await prisma.projectStatusLink.findUnique({
            where: {
              projectId_statusId: {
                projectId: id,
                statusId: sId
              }
            }
          });

          if (!existingLink) {
            // Create new status link
            await prisma.projectStatusLink.create({
              data: {
                projectId: id,
                statusId: sId,
                isPrimary: false // Additional statuses are not primary
              }
            });
          }
        }
      }

      // If removing specific statuses
      if (removeStatusIds && removeStatusIds.length > 0) {
        // Don't remove the primary status
        const primaryStatusLink = await prisma.projectStatusLink.findFirst({
          where: {
            projectId: id,
            isPrimary: true
          }
        });

        const statusesToRemove = primaryStatusLink
          ? removeStatusIds.filter(sId => sId !== primaryStatusLink.statusId)
          : removeStatusIds;

        if (statusesToRemove.length > 0) {
          await prisma.projectStatusLink.deleteMany({
            where: {
              projectId: id,
              statusId: { in: statusesToRemove }
            }
          });
        }
      }
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        status: true, // Primary status
        statuses: { // All statuses
          include: {
            status: true
          }
        },
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

    // More detailed error message
    let errorMessage = "An error occurred while updating the project";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = `Update failed: ${error.message}`;

      // Check for specific Prisma errors
      if (error.message.includes('Foreign key constraint failed')) {
        errorMessage = "Invalid status ID or other reference";
        statusCode = 400;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: statusCode }
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

    // Get the ID from params
    const { id } = params;

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