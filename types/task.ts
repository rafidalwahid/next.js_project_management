export interface Subtask {
  id: string
  title: string
  priority: string
  assignedToId?: string | null
  assignedTo?: {
    id: string
    name: string | null
    image: string | null
  } | null
  assignees?: {
    id: string
    user: {
      id: string
      name: string | null
      email?: string
      image: string | null
    }
  }[]
  subtasks?: Subtask[]
  parentId?: string | null
  projectId: string
  completed?: boolean
  dueDate?: string | null
}

export interface TaskMoveOperation {
  id: string
  newParentId: string | null
  oldParentId: string | null
  newIndex?: number
}

export interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  startDate?: string | null
  endDate?: string | null
  dueDate?: string | null
  timeSpent?: number | null
  estimatedTime?: number | null
  projectId: string
  statusId?: string | null
  parentId?: string | null
  order: number
  completed: boolean
  createdAt: string
  updatedAt: string
  assignees?: TaskAssignee[]
  status?: {
    id: string
    name: string
    color: string
  } | null
}
