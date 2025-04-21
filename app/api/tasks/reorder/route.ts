import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const { taskId, newParentId, oldParentId, targetTaskId, isSameParentReorder } = await request.json()

    console.log('Reorder task request:', { taskId, newParentId, oldParentId, targetTaskId, isSameParentReorder })

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        parentId: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    // If newParentId is provided, verify it exists and belongs to the same project
    if (newParentId) {
      const newParent = await prisma.task.findUnique({
        where: { id: newParentId },
        select: { projectId: true },
      })

      if (!newParent) {
        return NextResponse.json(
          { error: "New parent task not found" },
          { status: 404 }
        )
      }

      if (newParent.projectId !== task.projectId) {
        return NextResponse.json(
          { error: "Cannot move task to a different project" },
          { status: 400 }
        )
      }

      // Prevent circular references
      if (newParentId === taskId) {
        return NextResponse.json(
          { error: "A task cannot be its own parent" },
          { status: 400 }
        )
      }

      // Check if the new parent is a descendant of the task (would create a cycle)
      let currentParentId = newParentId
      while (currentParentId) {
        if (currentParentId === taskId) {
          return NextResponse.json(
            { error: "Cannot create a circular reference in the task hierarchy" },
            { status: 400 }
          )
        }

        const parent = await prisma.task.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        })

        currentParentId = parent?.parentId || null
      }
    }

    // Get the task details for the activity log
    const taskDetails = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        projectId: true
      }
    })

    if (!taskDetails) {
      return NextResponse.json(
        { error: "Task details not found" },
        { status: 404 }
      )
    }

    // Handle reordering within the same parent vs. changing parent
    let updatedTask;

    if (isSameParentReorder && targetTaskId) {
      // This is a reordering operation within the same parent
      // Since we don't have an explicit order field, we'll use the createdAt field
      // to simulate reordering by setting it to a timestamp that will place it
      // in the desired position when sorted by createdAt

      // Get the target task's createdAt timestamp
      const targetTask = await prisma.task.findUnique({
        where: { id: targetTaskId },
        select: { createdAt: true }
      });

      if (!targetTask) {
        return NextResponse.json(
          { error: "Target task not found" },
          { status: 404 }
        );
      }

      // Create a new timestamp slightly before the target task's timestamp
      // This will place the task right before the target when sorted by createdAt
      const newTimestamp = new Date(targetTask.createdAt.getTime() - 1000); // 1 second earlier

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          // Update the createdAt to change the order
          createdAt: newTimestamp,
          updatedAt: new Date(), // Also update the updatedAt timestamp
        },
        select: {
          id: true,
          title: true,
          parentId: true,
          createdAt: true,
          parent: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })
    } else {
      // This is a parent change operation
      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          parentId: newParentId || null,
        },
        select: {
          id: true,
          title: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })
    }

    // Log the activity
    await prisma.activity.create({
      data: {
        action: isSameParentReorder ? "reordered" : "moved",
        entityType: "task",
        entityId: taskId, // This is the ID of the task being moved
        description: isSameParentReorder
          ? `Subtask "${taskDetails.title}" was reordered within its parent`
          : newParentId
            ? `Task "${taskDetails.title}" was moved to be a subtask of another task`
            : oldParentId
              ? `Subtask "${taskDetails.title}" was promoted to a top-level task`
              : `Task "${taskDetails.title}" was reordered`,
        userId: session.user.id,
        projectId: taskDetails.projectId,
        taskId: taskId, // This links the activity to the task
      },
    })

    return NextResponse.json({
      success: true,
      message: "Task reordered successfully",
      task: updatedTask
    }, { status: 200 })
  } catch (error) {
    console.error("Error reordering task:", error)

    // Provide more detailed error information
    let errorMessage = "An error occurred while reordering the task";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };

      // Check for Prisma-specific errors
      if (error.message.includes("Record to update not found")) {
        errorMessage = "Task not found or has been deleted";
      } else if (error.message.includes("Foreign key constraint failed")) {
        errorMessage = "Cannot move task to the specified parent";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}
