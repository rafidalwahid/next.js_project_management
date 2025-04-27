import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { checkTaskPermission } from "@/lib/permissions/task-permissions";
import { getTaskIncludeObject } from "@/lib/queries/task-queries";

interface Params {
  params: {
    taskId: string;
  } | Promise<{ taskId: string }>;
}

// GET handler to get a task by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    // In Next.js, params might be a promise that needs to be awaited
    const { taskId } = await params;

    // Check permission
    const { hasPermission, task, error } = await checkTaskPermission(taskId, session, 'view');

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === "Task not found" ? 404 : 403 });
    }

    // Get task with full details - include 3 levels of subtasks and activities
    const taskWithDetails = await prisma.task.findUnique({
      where: { id: taskId },
      include: getTaskIncludeObject(3, true, 5) // 3 levels deep, include activities, 5 activities max
    });

    console.log('GET task response:', JSON.stringify({
      id: taskWithDetails?.id,
      title: taskWithDetails?.title,
      dueDate: taskWithDetails?.dueDate
    }, null, 2));

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
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedTime: z.number().optional().nullable(),
  timeSpent: z.number().optional().nullable(),
  statusId: z.string().optional().nullable(),
  completed: z.boolean().optional(),
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
    const { taskId } = await params;
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
    const { hasPermission, task, error } = await checkTaskPermission(taskId, session, 'update');

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === "Task not found" ? 404 : 403 });
    }

    const {
      title,
      description,
      priority,
      startDate,
      endDate,
      dueDate,
      estimatedTime,
      timeSpent,
      statusId,
      completed,
      assignedToId,
      assigneeIds,
      projectId,
      parentId
    } = validationResult.data;

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (completed !== undefined) updateData.completed = completed;

    if (startDate !== undefined) {
      if (startDate === null) {
        updateData.startDate = null;
      } else if (typeof startDate === 'string' && startDate.trim() !== "") {
        updateData.startDate = new Date(startDate);
      } else {
        updateData.startDate = null;
      }
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        updateData.endDate = null;
      } else if (typeof endDate === 'string' && endDate.trim() !== "") {
        updateData.endDate = new Date(endDate);
      } else {
        updateData.endDate = null;
      }
    }

    if (dueDate !== undefined) {
      console.log('Setting dueDate:', dueDate);
      // Handle null case explicitly
      if (dueDate === null) {
        updateData.dueDate = null;
        console.log('Setting dueDate to null');
      } else if (typeof dueDate === 'string' && dueDate.trim() !== "") {
        updateData.dueDate = new Date(dueDate);
        console.log('Converted dueDate to Date object:', updateData.dueDate);
      } else {
        updateData.dueDate = null;
        console.log('Setting dueDate to null (fallback)');
      }
    }

    if (estimatedTime !== undefined) {
      updateData.estimatedTime = estimatedTime;
    }

    if (timeSpent !== undefined) {
      updateData.timeSpent = timeSpent;
    }

    if (statusId !== undefined) {
      if (statusId === null) {
        updateData.statusId = null;
      } else {
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

        updateData.statusId = statusId;
      }
    }

    // Note: assignedToId is deprecated in favor of the TaskAssignee model
    // We'll set it to null to encourage using the TaskAssignee model instead
    if (assignedToId !== undefined) {
      // For backward compatibility, if assignedToId is provided, we'll add this user
      // to the task assignees list instead of using the direct field
      if (assignedToId !== null && assignedToId !== "") {
        // Verify the user exists
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

        // Instead of setting assignedToId, we'll ensure this user is in the assignees list
        if (assigneeIds === undefined) {
          // Get current assignees
          const currentAssignees = await prisma.taskAssignee.findMany({
            where: { taskId },
            select: { userId: true }
          });

          const currentUserIds = currentAssignees.map(a => a.userId);

          // Only add if not already an assignee
          if (!currentUserIds.includes(assignedToId)) {
            await prisma.taskAssignee.create({
              data: {
                taskId,
                userId: assignedToId
              }
            });

            // Also add as team member if needed
            const isTeamMember = await prisma.teamMember.findUnique({
              where: {
                projectId_userId: {
                  projectId: task.projectId,
                  userId: assignedToId
                }
              }
            });

            if (!isTeamMember) {
              await prisma.teamMember.create({
                data: {
                  projectId: task.projectId,
                  userId: assignedToId
                }
              });
            }
          }
        }
      }

      // Always set the direct assignedToId to null to encourage using TaskAssignee
      updateData.assignedToId = null;
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
        if (parentId === taskId) {
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
        // Instead of denying access, add the user as a team member
        await prisma.teamMember.create({
          data: {
            userId: session.user.id,
            projectId,
          }
        });
        console.log(`Added user ${session.user.id} as team member to project ${projectId}`);
      }

      updateData.projectId = projectId;
    }

    // Create activity description
    let activityDescription = "Task was updated";
    if (assignedToId && assignedToId !== task.assignedToId) {
      activityDescription = "Task was reassigned";
    } else if (statusId && statusId !== task.statusId) {
      activityDescription = "Task status was changed";
    } else if (completed !== undefined && completed !== task.completed) {
      activityDescription = completed ? "Task was marked as completed" : "Task was marked as incomplete";
    }

    // Handle assigneeIds if provided
    if (assigneeIds !== undefined) {
      try {
        // Ensure the current user is included in the assignees list
        let allAssigneeIds = [...assigneeIds];

        // Add the current user as an assignee if they're not already in the list
        if (session && session.user.id && !allAssigneeIds.includes(session.user.id)) {
          allAssigneeIds.push(session.user.id);
          console.log(`Added current user ${session.user.id} to assignees list`);
        }

        // Validate that all assigneeIds refer to existing users
        if (allAssigneeIds.length > 0) {
          const userCount = await prisma.user.count({
            where: {
              id: {
                in: allAssigneeIds
              }
            }
          });

          if (userCount !== allAssigneeIds.length) {
            return NextResponse.json(
              { error: "One or more users in assigneeIds not found" },
              { status: 400 }
            );
          }
        }

        // Get existing assignees
        const existingAssignees = await prisma.taskAssignee.findMany({
          where: { taskId: taskId },
          select: { userId: true }
        });

        const existingUserIds = existingAssignees.map(a => a.userId);

        // Determine which assignees to add and which to remove
        const assigneesToAdd = allAssigneeIds.filter(id => !existingUserIds.includes(id));
        const assigneesToRemove = existingUserIds.filter(id => !allAssigneeIds.includes(id));

        console.log(`Task update: Adding ${assigneesToAdd.length} assignees, removing ${assigneesToRemove.length} assignees`);

        // Remove assignees that are no longer in the list
        if (assigneesToRemove.length > 0) {
          await prisma.taskAssignee.deleteMany({
            where: {
              taskId: taskId,
              userId: { in: assigneesToRemove }
            }
          });
        }

        // Add new assignees and make them team members if needed
        if (assigneesToAdd.length > 0) {
          await Promise.all(
            assigneesToAdd.map(async (userId) => {
              // Create task assignee
              await prisma.taskAssignee.create({
                data: {
                  taskId: taskId,
                  userId,
                }
              });

              // Check if user is already a team member of the project
              const existingTeamMember = await prisma.teamMember.findUnique({
                where: {
                  projectId_userId: {
                    projectId: task.projectId,
                    userId
                  }
                }
              });

              // If not, add them as a team member
              if (!existingTeamMember) {
                await prisma.teamMember.create({
                  data: {
                    userId,
                    projectId: task.projectId,
                  }
                });
                console.log(`Added user ${userId} as team member to project ${task.projectId} during task update`);
              }
            })
          );
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

    // If assigneeIds wasn't provided, ensure the current user is an assignee
    if (assigneeIds === undefined) {
      try {
        // Check if the current user is already an assignee
        const existingAssignee = await prisma.taskAssignee.findUnique({
          where: {
            taskId_userId: {
              taskId: taskId,
              userId: session.user.id
            }
          }
        });

        // If not, add them
        if (!existingAssignee) {
          await prisma.taskAssignee.create({
            data: {
              taskId: taskId,
              userId: session.user.id
            }
          });
          console.log(`Added current user ${session.user.id} as assignee (fallback)`);

          // Also check if the user is a team member of the project
          const existingTeamMember = await prisma.teamMember.findUnique({
            where: {
              projectId_userId: {
                projectId: task.projectId,
                userId: session.user.id
              }
            }
          });

          // If not, add them as a team member
          if (!existingTeamMember) {
            await prisma.teamMember.create({
              data: {
                userId: session.user.id,
                projectId: task.projectId,
              }
            });
            console.log(`Added current user ${session.user.id} as team member to project ${task.projectId} (fallback)`);
          }
        }
      } catch (error) {
        console.error('Error ensuring current user is assignee:', error);
        // Continue with the task update even if this fails
      }
    }

    console.log('Updating task with data:', {
      ...updateData,
      dueDate: updateData.dueDate
    });

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updateData,
        // Log activity
        activities: {
          create: {
            action: "updated",
            entityType: "task",
            entityId: taskId,
            description: activityDescription,
            userId: session.user.id,
            projectId: task.projectId,
          }
        }
      },
      include: getTaskIncludeObject(3) // 3 levels deep, no activities
    });

    console.log('Updated task:', JSON.stringify({
      id: updatedTask.id,
      title: updatedTask.title,
      dueDate: updatedTask.dueDate
    }, null, 2));

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
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    console.log('DELETE task handler called with params:', params);
    const session = await getServerSession(authOptions);
    // In Next.js, params might be a promise that needs to be awaited
    const { taskId } = await params;
    console.log('DELETE task: Task ID to delete:', taskId);

    // Check permission
    const { hasPermission, task, error } = await checkTaskPermission(taskId, session, 'delete');

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
      where: { parentId: taskId }
    });

    console.log('DELETE task: Subtasks count:', subtasksCount);

    try {
      // Delete task
      await prisma.task.delete({
        where: { id: taskId }
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
            where: { parentId: taskId }
          });

          // Now try to delete the task again
          await prisma.task.delete({
            where: { id: taskId }
          });
        } catch (cascadeError) {
          console.error('DELETE task: Error during cascade deletion:', cascadeError);
          throw cascadeError;
        }
      } else {
        throw deleteError;
      }
    }

    console.log('DELETE task: Successfully deleted task with ID:', taskId);
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
