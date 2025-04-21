export interface Subtask {
  id: string
  title: string
  status: string
  priority: string
  assignedToId?: string | null
  assignedTo?: {
    id: string
    name: string | null
    image: string | null
  } | null
  subtasks?: Subtask[]
  parentId?: string | null
  projectId: string
}

export interface TaskMoveOperation {
  id: string
  newParentId: string | null
  oldParentId: string | null
  newIndex?: number
}
