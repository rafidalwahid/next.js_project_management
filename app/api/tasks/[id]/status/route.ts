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

// Validation schema for updating task status
const updateStatusSchema = z.object({
  status: z.enum(["pending", "in-progress", "completed"]),
});

// PATCH handler to update just the task status (optimized for Kanban operations)
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
    const validationResult = updateStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

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

    // Create activity description
    const activityDescription = `Task status changed from "${task.status}" to "${status}"`;

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
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
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the task status" },
      { status: 500 }
    );
  }
}