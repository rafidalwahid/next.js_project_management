import { Subtask } from "@/types/task"

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(name: string | null): string {
  if (!name) return "U"

  const nameParts = name.split(" ")
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
  }

  return nameParts[0].substring(0, 2).toUpperCase()
}

/**
 * Find a subtask in the entire tree by ID
 */
export function findSubtaskById(id: string, tasks: Subtask[]): Subtask | null {
  // First check at the current level
  const directMatch = tasks.find(task => task.id === id)
  if (directMatch) return directMatch

  // If not found, recursively search in all subtasks
  for (const task of tasks) {
    if (task.subtasks && task.subtasks.length > 0) {
      const found = findSubtaskById(id, task.subtasks)
      if (found) return found
    }
  }

  // Not found anywhere in the tree
  return null
}

/**
 * Log the subtask structure for debugging
 */
export function logSubtaskStructure(tasks: Subtask[], level = 0): void {
  tasks.forEach(task => {
    console.log(
      `${'  '.repeat(level)}${task.title} ` +
      `(ID: ${task.id}, ` +
      `Parent: ${task.parentId || 'none'}, ` +
      `Priority: ${task.priority}, ` +
      `Nested: ${task.subtasks?.length || 0})`
    )
    if (task.subtasks && task.subtasks.length > 0) {
      logSubtaskStructure(task.subtasks, level + 1)
    }
  })
}
