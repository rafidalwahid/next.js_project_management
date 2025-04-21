import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

// GET handler to list tasks
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get search params
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (priority) {
      where.priority = priority;
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Only get top-level tasks (no parentId) unless specifically requested
    if (!searchParams.has("includeSubtasks") && !searchParams.has("parentId")) {
      where.parentId = null;
    }

    // If parentId is specified, get subtasks of that parent
    const parentId = searchParams.get("parentId");
    if (parentId) {
      where.parentId = parentId;
    }

    // Get tasks with pagination
    const tasks = await prisma.task.findMany({
      where,
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
        subtasks: {
          orderBy: {
            order: 'asc' // Order subtasks by the explicit order field
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            // Include one level of nested subtasks
            subtasks: {
              orderBy: {
                order: 'asc' // Order nested subtasks by the explicit order field too
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
      },
      orderBy: [
        { priority: "desc" },
        { order: "asc" },
        { dueDate: "asc" },
        { updatedAt: "desc" }
      ],
      take: limit,
      skip: skip,
    });

    return NextResponse.json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching tasks" },
      { status: 500 }
    );
  }
}

// Validation schema for creating a task
const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional().nullable(),
  projectId: z.string(),
  assignedToId: z.string().optional().nullable(), // Kept for backward compatibility
  assigneeIds: z.array(z.string()).optional(), // New field for multiple assignees
  parentId: z.string().optional().nullable(), // New field for parent task reference
});

// POST handler to create a task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validationResult = createTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { title, description, status, priority, dueDate, projectId, assignedToId, assigneeIds, parentId } = validationResult.data;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: {
          where: {
            userId: session.user.id
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Ensure user has access to this project
    // Check if user is admin, project creator, or team member
    const isAdmin = session.user.role === 'admin';
    const isProjectCreator = project.createdById === session.user.id;
    const isTeamMember = project.teamMembers.length > 0;

    const hasAccess = isAdmin || isProjectCreator || isTeamMember;

    console.log('Permission check:', {
      userId: session.user.id,
      userRole: session.user.role,
      isAdmin,
      isProjectCreator,
      isTeamMember,
      hasAccess
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to add tasks to this project" },
        { status: 403 }
      );
    }

    // If this is a subtask, verify parent task exists and belongs to the same project
    if (parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: parentId },
        select: { projectId: true }
      });

      if (!parentTask) {
        return NextResponse.json({ error: "Parent task not found" }, { status: 404 });
      }

      if (parentTask.projectId !== projectId) {
        return NextResponse.json(
          { error: "Subtask must belong to the same project as parent task" },
          { status: 400 }
        );
      }
    }

    // Get the highest order value for tasks with the same parent
    const highestOrderTask = await prisma.task.findFirst({
      where: {
        projectId,
        parentId: parentId || null
      },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    // Set the initial order value to be higher than the highest existing order
    const initialOrder = highestOrderTask ? highestOrderTask.order + 1000 : 1000;

    // Create task
    // Try to create with parentId first, but handle the case where the schema doesn't have parentId
    let task;
    try {
      // Create the task first
      task = await prisma.task.create({
        data: {
          title,
          description,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          assignedToId, // Keep for backward compatibility
          parentId,
          order: initialOrder, // Set the initial order value
          // We'll create the activity separately after the task is created
          // to ensure we have the entityId
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

        subtasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            // Include one level of nested subtasks
            subtasks: {
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
    });

    } catch (error) {
      // If the error is about unknown field 'parentId', try creating without it
      if (error instanceof Error && error.message.includes("Unknown field `parentId`")) {
        console.warn("Creating task without parentId due to schema mismatch");

        // Create task without parentId
        task = await prisma.task.create({
          data: {
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            projectId,
            assignedToId,
            order: initialOrder, // Set the initial order value
            // parentId is omitted
            // We'll create the activity separately after the task is created
            // to ensure we have the entityId
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
            // We can't safely include subtasks if the schema doesn't support it
            // So we'll omit it in the fallback case
          }
        });

        // Create activity for the task
        try {
          // First, verify that the user exists in the database
          const userExists = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
          });

          if (userExists) {
            await prisma.activity.create({
              data: {
                action: "created",
                entityType: "task",
                entityId: task.id,
                description: parentId
                  ? `Task "${title}" was created (note: subtask relationship not saved due to schema mismatch)`
                  : `Task "${title}" was created`,
                userId: session.user.id,
                projectId,
                taskId: task.id,
              }
            });
          } else {
            console.warn(`Activity not created: User ID ${session.user.id} not found in database`);
          }
        } catch (activityError) {
          // Log the error but don't fail the task creation
          console.error('Error creating activity in fallback case:', activityError);
        }

        // Return with a warning
        return NextResponse.json({
          task,
          warning: "Task created but subtask relationship could not be saved due to schema mismatch. Run 'npx prisma generate' to fix this issue."
        }, { status: 201 });
      } else {
        // If it's another error, rethrow it
        throw error;
      }
    }

    // Now create the activity with the task's ID as entityId
    try {
      // First, verify that the user exists in the database
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      });

      if (userExists) {
        await prisma.activity.create({
          data: {
            action: "created",
            entityType: parentId ? "subtask" : "task",
            entityId: task.id, // Now we have the task ID
            description: parentId
              ? `Subtask "${title}" was created under task ID ${parentId}`
              : `Task "${title}" was created`,
            userId: session.user.id,
            projectId,
            taskId: task.id, // Link to the task
          }
        });
      } else {
        console.warn(`Activity not created: User ID ${session.user.id} not found in database`);
      }
    } catch (activityError) {
      // Log the error but don't fail the task creation
      console.error('Error creating activity:', activityError);
    }

    // Create task assignees if assigneeIds is provided
    if (assigneeIds && assigneeIds.length > 0) {
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
          // Create task assignees
          await Promise.all(
            assigneeIds.map(async (userId) => {
              return prisma.taskAssignee.create({
                data: {
                  taskId: task.id,
                  userId,
                }
              });
            })
          );

          // Fetch the task with assignees to get the complete data
          const updatedTask = await prisma.task.findUnique({
            where: { id: task.id },
            include: {
              assignees: {
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
              }
            }
          });

          if (updatedTask && 'assignees' in updatedTask && updatedTask.assignees) {
            // Use type assertion to handle the dynamic property
            (task as any).assignees = updatedTask.assignees;
          }
        } else {
          console.warn('TaskAssignee table does not exist yet. Skipping assignee creation.');
        }
      } catch (error) {
        console.error("Error creating task assignees:", error);
        // Don't fail the task creation if assignee creation fails
      }
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);

    // Provide more detailed error information
    let errorMessage = "An error occurred while creating the task";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };

      // Check for Prisma-specific errors
      if (error.message.includes("Unknown field `parentId`")) {
        errorMessage = "Database schema mismatch: parentId field is missing";
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