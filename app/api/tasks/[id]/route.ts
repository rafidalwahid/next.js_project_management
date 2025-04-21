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

    // First check if TaskAssignee table exists
    let hasTaskAssigneeTable = false;
    try {
      const result = await prisma.$queryRaw`SHOW TABLES LIKE 'TaskAssignee'`;
      hasTaskAssigneeTable = Array.isArray(result) && result.length > 0;
    } catch (err) {
      console.error('Error checking for TaskAssignee table:', err);
    }

    // Prepare the include object for the query
    const includeObj: any = {
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
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ],
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          subtasks: {
            orderBy: [
              { order: 'asc' },
              { createdAt: 'asc' }
            ],
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              },
              subtasks: {
                orderBy: [
                  { order: 'asc' },
                  { createdAt: 'asc' }
                ],
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
    };

    // Add assignees relation if the table exists
    if (hasTaskAssigneeTable) {
      includeObj.assignees = {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      };
    }

    // Get task with related data
    const task = await prisma.task.findUnique({
      where: { id },
      include: includeObj
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
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
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
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

    const { title, description, status, priority, dueDate, assignedToId, assigneeIds, projectId, parentId } = validationResult.data;

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

    // Handle assigneeIds if provided
    if (assigneeIds !== undefined) {
      try {
        // Check if TaskAssignee table exists
        let hasTaskAssigneeTable = false;
        try {
          const result = await prisma.$queryRaw`SHOW TABLES LIKE 'TaskAssignee'`;
          hasTaskAssigneeTable = Array.isArray(result) && result.length > 0;
        } catch (err) {
          console.error('Error checking for TaskAssignee table:', err);
        }

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
          orderBy: {
            order: 'asc'
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
                order: 'asc'
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
                    order: 'asc'
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
    console.log('DELETE task handler called with params:', params);
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      console.log('DELETE task: Unauthorized - no session or user ID');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Next.js 14, params is a Promise that needs to be awaited
    const { id } = await params;
    console.log('DELETE task: Task ID to delete:', id);

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
        },
        assignees: {
          where: {
            userId: session.user.id
          }
        }
      }
    });

    if (!task) {
      console.log('DELETE task: Task not found with ID:', id);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    console.log('DELETE task: Found task:', {
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      parentId: task.parentId
    });

    // Check if user has permission to delete this task
    // Allow task deletion if:
    // 1. User is the project creator
    // 2. User is a team member with any role
    // 3. User is the one assigned to the task
    // 4. User is an admin
    const isProjectCreator = task.project.createdById === session.user.id;
    const isTeamMember = task.project.teamMembers.length > 0;
    const isAssignedToTask = task.assignedToId === session.user.id;
    const isTaskAssignee = task.assignees && task.assignees.length > 0;
    const isAdmin = session.user.role === 'admin';

    // Always allow deletion for admins and project creators
    // For regular users, they need to be a team member or assigned to the task
    let hasPermission = isAdmin || isProjectCreator || isTeamMember || isAssignedToTask || isTaskAssignee;

    console.log('DELETE task: Permission check:', {
      hasPermission,
      isProjectCreator,
      isTeamMember,
      isAssignedToTask,
      isTaskAssignee,
      isAdmin,
      projectCreatedById: task.project.createdById,
      sessionUserId: session.user.id,
      taskAssignedToId: task.assignedToId,
      assigneesCount: task.assignees ? task.assignees.length : 0,
      userRole: session.user.role,
      teamMembersCount: task.project.teamMembers.length
    });

    if (!hasPermission) {
      // Special case for subtasks - if this is a subtask, check if the user has permission on the parent task
      if (task.parentId) {
        console.log('DELETE task: This is a subtask, checking parent task permissions');
        try {
          const parentTask = await prisma.task.findUnique({
            where: { id: task.parentId },
            include: {
              project: {
                include: {
                  teamMembers: {
                    where: {
                      userId: session.user.id
                    }
                  }
                }
              },
              assignees: {
                where: {
                  userId: session.user.id
                }
              }
            }
          });

          if (parentTask) {
            const isParentProjectCreator = parentTask.project.createdById === session.user.id;
            const isParentTeamMember = parentTask.project.teamMembers.length > 0;
            const isParentAssignedToTask = parentTask.assignedToId === session.user.id;
            const isParentTaskAssignee = parentTask.assignees && parentTask.assignees.length > 0;

            const hasParentPermission = isAdmin || isParentProjectCreator || isParentTeamMember ||
                                      isParentAssignedToTask || isParentTaskAssignee;

            console.log('DELETE task: Parent task permission check:', {
              hasParentPermission,
              isParentProjectCreator,
              isParentTeamMember,
              isParentAssignedToTask,
              isParentTaskAssignee
            });

            if (hasParentPermission) {
              console.log('DELETE task: User has permission on parent task, allowing deletion');
              // User has permission on the parent task, so allow deletion of this subtask
              hasPermission = true;
            }
          }
        } catch (parentCheckError) {
          console.error('DELETE task: Error checking parent task permissions:', parentCheckError);
          // Continue with normal permission check
        }
      }

      // If still no permission, deny access
      if (!hasPermission) {
        console.log('DELETE task: Permission denied');
        return NextResponse.json(
          { error: "You don't have permission to delete this task" },
          { status: 403 }
        );
      }
    }

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