import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { PermissionService } from "@/lib/permissions/unified-permission-service";
import { Task } from "@/types/task";
import { ProjectStatus } from "@/types/project";

// PATCH: Update a task's status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.taskId;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            teamMembers: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to update the task
    const isTeamMember = task.project.teamMembers.some(tm => tm.userId === session.user.id);
    const hasTaskManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      "task_management"
    );

    if (!isTeamMember && !hasTaskManagementPermission) {
      return NextResponse.json(
        { error: "You don't have permission to update this task" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body
    const schema = z.object({
      statusId: z.string(),
    });

    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { statusId } = validationResult.data;

    // Verify the status exists and belongs to the task's project
    const status = await prisma.projectStatus.findFirst({
      where: {
        id: statusId,
        projectId: task.projectId,
      },
    });

    if (!status) {
      return NextResponse.json(
        { error: "Status not found or does not belong to the task's project" },
        { status: 404 }
      );
    }

    // Get the old status for activity logging
    const oldStatus = task.statusId
      ? await prisma.projectStatus.findUnique({
          where: { id: task.statusId },
          select: { name: true },
        })
      : null;

    // Update the task's status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { statusId },
      include: {
        project: { select: { title: true } },
        status: true,
        assignees: {
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
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        action: "status_changed",
        entityType: "task",
        entityId: taskId,
        description: `Task "${updatedTask.title}" moved from ${
          oldStatus ? `"${oldStatus.name}"` : "no status"
        } to "${status.name}"`,
        userId: session.user.id,
        projectId: task.projectId,
        taskId,
      },
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
