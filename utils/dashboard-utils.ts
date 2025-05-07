import { ProjectSummary, ProjectStatusDistribution } from "@/types/dashboard";

/**
 * Calculate total tasks and completed tasks from projects
 */
export function calculateTaskStats(projects: ProjectSummary[]) {
  const totalTasks = projects.reduce((sum, project) => sum + (project.taskCount || 0), 0);
  const completedTasks = projects.reduce((sum, project) => sum + (project.completedTaskCount || 0), 0);
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate
  };
}

/**
 * Calculate unique team members across projects
 */
export function calculateTeamMembers(projects: ProjectSummary[]) {
  const teamMembersSet = new Set();
  projects.forEach(project => {
    project.team?.forEach(member => {
      if (member?.id) teamMembersSet.add(member.id);
    });
  });
  
  return {
    teamMembersCount: teamMembersSet.size,
    uniqueMembers: Array.from(teamMembersSet)
  };
}

/**
 * Calculate project status distribution
 */
export function calculateProjectStatusDistribution(projects: ProjectSummary[]): ProjectStatusDistribution {
  return {
    notStarted: projects.filter(p => p.progress === 0).length,
    inProgress: projects.filter(p => p.progress > 0 && p.progress < 100).length,
    completed: projects.filter(p => p.progress === 100).length,
  };
}

/**
 * Extract simulated tasks from projects
 * Note: This is a temporary function until real task data is available
 */
export function extractTasksFromProjects(projects: ProjectSummary[]) {
  const allTasks = [];
  
  projects.forEach(project => {
    // For each project, create simulated tasks based on task counts
    const completedTaskCount = project.completedTaskCount || 0;
    const pendingTaskCount = (project.taskCount || 0) - completedTaskCount;
    
    // Add completed tasks
    for (let i = 0; i < completedTaskCount; i++) {
      allTasks.push({
        id: `${project.id}-completed-${i}`,
        title: `Task ${i + 1}`,
        projectTitle: project.title,
        projectId: project.id,
        completed: true,
        dueDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      });
    }
    
    // Add pending tasks
    for (let i = 0; i < pendingTaskCount; i++) {
      allTasks.push({
        id: `${project.id}-pending-${i}`,
        title: `Task ${completedTaskCount + i + 1}`,
        projectTitle: project.title,
        projectId: project.id,
        completed: false,
        dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      });
    }
  });
  
  return allTasks;
}
