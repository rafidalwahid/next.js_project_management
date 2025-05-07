// Dashboard stats interfaces

export interface ProjectMember {
  id: string;
  name?: string;
  image?: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description?: string;
  createdBy?: {
    id: string;
    name?: string;
  };
  teamCount: number;
  taskCount: number;
  completedTaskCount: number;
  progress: number;
  team: ProjectMember[];
}

export interface SystemStats {
  totalUsers: number;
  usersByRole: {
    admin: number;
    manager: number;
    user: number;
  };
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface DashboardStats {
  totalProjects: number;
  recentProjects: ProjectSummary[];
  projectGrowth: number;
  systemStats: SystemStats | null;
}

export interface ProjectStatusDistribution {
  notStarted: number;
  inProgress: number;
  completed: number;
}

export interface TaskSummary {
  id: string;
  title: string;
  projectTitle: string;
  projectId: string;
  completed: boolean;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}
