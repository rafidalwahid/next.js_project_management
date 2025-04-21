import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { checkProjectPermission } from "@/lib/permissions/project-permissions";
import { checkTaskPermission } from "@/lib/permissions/task-permissions";
import { getTaskIncludeObject, getTaskListIncludeObject, taskOrderBy } from "@/lib/queries/task-queries";
import { getNextOrderValue } from "@/lib/ordering/task-ordering";

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

    // Get tasks with pagination - use optimized include for list view
    const tasks = await prisma.task.findMany({
      where,
      include: getTaskListIncludeObject(),
      orderBy: taskOrderBy,
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

    // Check project permission
    const { hasPermission, project, error } = await checkProjectPermission(projectId, session, 'update');
    // We'll use the project object later for activity creation

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === "Project not found" ? 404 : 403 });
    }

    // If this is a subtask, verify parent task exists and belongs to the same project
    if (parentId) {
      // Check parent task permission
      const parentResult = await checkTaskPermission(parentId, session, 'update');

      if (!parentResult.hasPermission) {
        return NextResponse.json(
          { error: parentResult.error },
          { status: parentResult.error === "Task not found" ? 404 : 403 }
        );
      }

      // Verify parent task belongs to the same project
      if (parentResult.task.projectId !== projectId) {
        return NextResponse.json(
          { error: "Subtask must belong to the same project as parent task" },
          { status: 400 }
        );
      }
    }

    // Get the next order value for the new task
    const initialOrder = await getNextOrderValue(projectId, parentId || null);

    // Create task
    const task = await prisma.task.create({
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
      include: getTaskIncludeObject(2) // Include 2 levels of subtasks
    });

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
        // TaskAssignee table should now exist in the schema
        const hasTaskAssigneeTable = true;

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