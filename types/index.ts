export interface Task {
  id: string
  title: string
  description: string
  projectId: string
  assignedTo: string
  dueDate: string
  priority?: "low" | "medium" | "high"
}

export interface Column {
  id: string
  title: string
  tasks: Task[]
}
