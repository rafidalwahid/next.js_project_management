import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { checkTaskPermission } from "@/lib/permissions/task-permissions";
import { getTaskIncludeObject } from "@/lib/queries/task-queries";

interface Params {
  params: {
    id: string;
  } | Promise<{ id: string }>;
}

// GET handler to get a task by ID
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    // In Next.js, params might be a promise that needs to be awaited
    const { id } = await params;

    // Check permission
    const { hasPermission, task, error } = await checkTaskPermission(id, session, 'view');

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === "Task not found" ? 404 : 403 });
    }

    // Get task with full details - include 3 levels of subtasks and activities
    const taskWithDetails = await prisma.task.findUnique({
      where: { id },
      include: getTaskIncludeObject(3, true, 5) // 3 levels deep, include activities, 5 activities max
    });

    return NextResponse.json({ task: taskWithDetails });
  } catch (error) {
    console.error("Error fetching task:", error);

    // Provide more detailed error information
    let errorMessage = "An error occurred while fetching the task";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };

      // Check for Prisma-specific errors
      if (error.message.includes("Unknown field")) {
        errorMessage = "Database schema mismatch: field is missing";
        errorDetails = {
          ...errorDetails,
          hint: "The Prisma client needs to be regenerated. Run 'npx prisma generate' to update it."
        };
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

// Validation schema for updating a task
const updateTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(), // Kept for backward compatibility
  assigneeIds: z.array(z.string()).optional(), // New field for multiple assignees
  projectId: z.string().optional(),
  parentId: z.string().optional().nullable(), // New field for parent task reference
});

// PATCH handler to update a task
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    // In Next.js, params might be a promise that needs to be awaited
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

    // Check permission
    const { hasPermission, task, error } = await checkTaskPermission(id, session, 'update');

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === "Task not found" ? 404 : 403 });
    }

    const { title, description, priority, dueDate, assignedToId, assigneeIds, projectId, parentId } = validationResult.data;

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate && dueDate.trim() !== "" ? new Date(dueDate) : null;

    // Validate assignedToId if it's being updated
    if (assignedToId !== undefined) {
      if (assignedToId === null || assignedToId === "") {
        updateData.assignedToId = null;
      } else {
        const userExists = await prisma.user.findUnique({
          where: { id: assignedToId },
          select: { id: true }
        });

        if (!userExists) {
          return NextResponse.json(
            { error: "Invalid assignedToId: User not found" },
            { status: 400 }
          );
        }
        updateData.assignedToId = assignedToId;
      }
    }

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
      if (!session || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

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
    if (assignedToId && assignedToId !== task.assignedToId) {
      activityDescription = "Task was reassigned";
    }

    // Handle assigneeIds if provided
    if (assigneeIds !== undefined) {
      try {
        // Validate that all assigneeIds refer to existing users
        if (assigneeIds.length > 0) {
          const userCount = await prisma.user.count({
            where: {
              id: {
                in: assigneeIds
              }
            }
          });

          if (userCount !== assigneeIds.length) {
            return NextResponse.json(
              { error: "One or more users in assigneeIds not found" },
              { status: 400 }
            );
          }
        }

        // TaskAssignee table should now exist in the schema
        const hasTaskAssigneeTable = true;

        if (hasTaskAssigneeTable) {
          // First, delete all existing assignees
          await prisma.taskAssignee.deleteMany({
            where: { taskId: id }
          });

          // Then create new assignees
          if (assigneeIds.length > 0) {
            await Promise.all(
              assigneeIds.map(async (userId) => {
                return prisma.taskAssignee.create({
                  data: {
                    taskId: id,
                    userId,
                  }
                });
              })
            );
          }
        } else {
          console.warn('TaskAssignee table does not exist yet. Skipping assignee updates.');
        }
      } catch (assigneeError) {
        console.error('Error handling assignees:', assigneeError);
        // Continue with the task update even if assignee handling fails
      }
    }

    // Ensure session exists before creating activity
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      include: getTaskIncludeObject(3) // 3 levels deep, no activities
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);

    // Provide more detailed error information
    let errorMessage = "An error occurred while updating the task";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };

      // Check for specific error types
      if (error.message.includes("foreign key constraint")) {
        errorMessage = "Cannot update this task due to database constraints";
        errorDetails = {
          ...errorDetails,
          hint: "The task may be referenced by other items."
        };
      } else if (error.message.includes("Record to update not found")) {
        errorMessage = "The task you're trying to update no longer exists";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a task
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    console.log('DELETE task handler called with params:', params);
    const session = await getServerSession(authOptions);
    // In Next.js, params might be a promise that needs to be awaited
    const { id } = await params;
    console.log('DELETE task: Task ID to delete:', id);

    // Check permission
    const { hasPermission, task, error } = await checkTaskPermission(id, session, 'delete');

    if (!hasPermission) {
      console.log('DELETE task: Permission denied -', error);
      return NextResponse.json({ error }, { status: error === "Task not found" ? 404 : 403 });
    }

    console.log('DELETE task: Found task:', {
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      parentId: task.parentId
    });

    // Check if task has subtasks
    const subtasksCount = await prisma.task.count({
      where: { parentId: id }
    });

    console.log('DELETE task: Subtasks count:', subtasksCount);

    try {
      // Delete task
      await prisma.task.delete({
        where: { id }
      });
    } catch (deleteError) {
      console.error('DELETE task: Error during deletion:', deleteError);

      // Check if this is a foreign key constraint error
      if (deleteError instanceof Error && deleteError.message.includes('foreign key constraint')) {
        // Try to delete all subtasks first
        console.log('DELETE task: Attempting to delete subtasks first');

        try {
          // Delete all subtasks
          await prisma.task.deleteMany({
            where: { parentId: id }
          });

          // Now try to delete the task again
          await prisma.task.delete({
            where: { id }
          });
        } catch (cascadeError) {
          console.error('DELETE task: Error during cascade deletion:', cascadeError);
          throw cascadeError;
        }
      } else {
        throw deleteError;
      }
    }

    console.log('DELETE task: Successfully deleted task with ID:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);

    // Provide more detailed error information
    let errorMessage = "An error occurred while deleting the task";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };

      // Check for specific error types
      if (error.message.includes("foreign key constraint")) {
        errorMessage = "Cannot delete this task because it has related items";
        errorDetails = {
          ...errorDetails,
          hint: "You may need to delete subtasks first."
        };
      } else if (error.message.includes("Record to delete does not exist")) {
        errorMessage = "The task you're trying to delete no longer exists";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}