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

// GET handler to get a task by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Next.js 14, params is a Promise that needs to be awaited
    const { id } = await params;

    // Get task with related data
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        activities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        subtasks: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            // Recursively include nested subtasks
            subtasks: {
              orderBy: {
                createdAt: 'asc'
              },
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                },
                // Include one more level of nesting
                subtasks: {
                  orderBy: {
                    createdAt: 'asc'
                  },
                  include: {
                    assignedTo: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the task" },
      { status: 500 }
    );
  }
}

// Validation schema for updating a task
const updateTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  projectId: z.string().optional(),
  parentId: z.string().optional().nullable(), // New field for parent task reference
});

// PATCH handler to update a task
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
    const validationResult = updateTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            teamMembers: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has access to this task's project
    const hasAccess =
      task.project.createdById === session.user.id ||
      task.assignedToId === session.user.id ||
      task.project.teamMembers.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to update this task" },
        { status: 403 }
      );
    }

    const { title, description, status, priority, dueDate, assignedToId, projectId, parentId } = validationResult.data;

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    // Handle parentId changes
    if (parentId !== undefined) {
      // If parentId is null, this task becomes a top-level task
      if (parentId === null) {
        updateData.parentId = null;
      } else {
        // Verify parent task exists and belongs to the same project
        const parentTask = await prisma.task.findUnique({
          where: { id: parentId },
          select: { projectId: true, parentId: true }
        });

        if (!parentTask) {
          return NextResponse.json({ error: "Parent task not found" }, { status: 404 });
        }

        // Prevent circular references (a task can't be its own ancestor)
        if (parentId === id) {
          return NextResponse.json(
            { error: "A task cannot be its own parent" },
            { status: 400 }
          );
        }

        // Check if the parent task is in the same project
        if (parentTask.projectId !== task.projectId) {
          return NextResponse.json(
            { error: "Parent task must be in the same project" },
            { status: 400 }
          );
        }

        updateData.parentId = parentId;
      }
    }

    if (projectId !== undefined) {
      // Verify that the user has access to the new project
      const newProject = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          teamMembers: {
            where: {
              userId: session.user.id
            }
          }
        }
      });

      if (!newProject) {
        return NextResponse.json({ error: "Target project not found" }, { status: 404 });
      }

      const hasProjectAccess =
        newProject.createdById === session.user.id ||
        newProject.teamMembers.length > 0;

      if (!hasProjectAccess) {
        return NextResponse.json(
          { error: "You don't have permission to move this task to the target project" },
          { status: 403 }
        );
      }

      updateData.projectId = projectId;
    }

    // Create activity description
    let activityDescription = "Task was updated";
    if (status && status !== task.status) {
      activityDescription = `Task status changed from "${task.status}" to "${status}"`;
    } else if (assignedToId && assignedToId !== task.assignedToId) {
      activityDescription = "Task was reassigned";
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        // Log activity
        activities: {
          create: {
            action: "updated",
            entityType: "task",
            entityId: id,
            description: activityDescription,
            userId: session.user.id,
            projectId: task.projectId,
          }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        subtasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            // Recursively include nested subtasks
            subtasks: {
              orderBy: {
                createdAt: 'asc'
              },
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                },
                // Include one more level of nesting
                subtasks: {
                  orderBy: {
                    createdAt: 'asc'
                  },
                  include: {
                    assignedTo: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the task" },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a task
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Next.js 14, params is a Promise that needs to be awaited
    const { id } = await params;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            teamMembers: {
              where: {
                userId: session.user.id,
                role: { in: ["owner", "admin"] }
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has permission to delete this task
    const hasPermission =
      task.project.createdById === session.user.id ||
      task.project.teamMembers.length > 0;

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to delete this task" },
        { status: 403 }
      );
    }

    // Delete task
    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the task" },
      { status: 500 }
    );
  }
}