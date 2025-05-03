import { Task } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Check if a task is completed based on its status or completed field
 * @param task The task to check
 * @returns True if the task is completed
 */
export function isTaskCompleted(task: Task & { status?: { isCompletedStatus: boolean } | null }): boolean {
  // First check the status.isCompletedStatus field (preferred method)
  if (task.status?.isCompletedStatus) {
    return true;
  }

  // Fall back to the completed field if status approach isn't available
  // This is for backward compatibility
  return !!(task as any).completed;
}

/**
 * Get the default completed status for a project
 * @param projectId The project ID
 * @returns The default completed status or null if none exists
 */
export async function getDefaultCompletedStatus(projectId: string): Promise<{ id: string; name: string } | null> {
  const status = await prisma.projectStatus.findFirst({
    where: {
      projectId,
      isCompletedStatus: true,
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (status) return status;

  // If no default completed status exists, try to find any completed status
  return prisma.projectStatus.findFirst({
    where: {
      projectId,
      isCompletedStatus: true,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

/**
 * Get the default non-completed status for a project
 * @param projectId The project ID
 * @returns The default non-completed status or null if none exists
 */
export async function getDefaultNonCompletedStatus(projectId: string): Promise<{ id: string; name: string } | null> {
  const status = await prisma.projectStatus.findFirst({
    where: {
      projectId,
      isCompletedStatus: false,
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (status) return status;

  // If no default non-completed status exists, try to find any non-completed status
  return prisma.projectStatus.findFirst({
    where: {
      projectId,
      isCompletedStatus: false,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

/**
 * Toggle a task's completion status
 * @param taskId The task ID
 * @returns The updated task
 */
export async function toggleTaskCompletion(taskId: string) {
  // Get the task with its current status and project
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      status: true,
      project: {
        include: {
          statuses: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Determine if the task is currently completed
  const isCurrentlyCompleted = task.status?.isCompletedStatus || false;

  // Find an appropriate status to switch to
  let targetStatusId: string | null = null;

  if (isCurrentlyCompleted) {
    // If task is completed, find a non-completed status
    const nonCompletedStatus = await getDefaultNonCompletedStatus(task.projectId);
    targetStatusId = nonCompletedStatus?.id || null;
  } else {
    // If task is not completed, find a completed status
    const completedStatus = await getDefaultCompletedStatus(task.projectId);
    targetStatusId = completedStatus?.id || null;
  }

  // If no appropriate status was found, we can't toggle
  if (!targetStatusId) {
    throw new Error(
      isCurrentlyCompleted
        ? "No non-completed status found for this project"
        : "No completed status found for this project"
    );
  }

  // Update the task with the new status and completed field for backward compatibility
  return prisma.task.update({
    where: { id: taskId },
    data: {
      statusId: targetStatusId,
      completed: !isCurrentlyCompleted // Update the completed field to match the status
    },
    include: {
      status: true,
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}
