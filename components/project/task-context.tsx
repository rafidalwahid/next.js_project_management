"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { taskApi } from '@/lib/api';
import { Task, TaskAssignee, TaskFilters } from '@/types/task';
import { ProjectStatus } from '@/types/project';
import { UserSummary } from '@/types/user';

interface TaskContextType {
  tasks: Task[];
  statuses: ProjectStatus[];
  isLoading: boolean;
  isTasksLoading: boolean;
  filteredTasks: Task[];
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  refreshTasks: () => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  moveTask: (taskId: string, statusId: string, targetTaskId?: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskAssignees: (taskId: string, assigneeIds: string[]) => Promise<void>;
  createTask: (data: any) => Promise<void>;
  editTask: (taskId: string) => void;
  users: UserSummary[];
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({
  children,
  projectId
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    statusIds: [],
    assigneeIds: [],
    priority: null,
    completed: null,
  });
  const { toast } = useToast();

  // Fetch statuses
  const fetchStatuses = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/statuses`);
      if (!response.ok) throw new Error("Failed to fetch statuses");
      const data = await response.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast({
        title: "Error",
        description: "Failed to load project statuses",
        variant: "destructive",
      });
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setIsTasksLoading(true);
      const response = await fetch(`/api/tasks?projectId=${projectId}&limit=100`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setIsTasksLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/team-management?projectId=${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch team members");
      const data = await response.json();

      // Extract user data from team members
      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        const users = data.teamMembers
          .map((tm: any) => tm.user)
          .filter((user: any) => user && user.id);
        setUsers(users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchStatuses(),
      fetchTasks(),
      fetchUsers()
    ]);
    setIsLoading(false);
  };

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    if (tasks.length === 0) return [];

    return tasks.filter(task => {
      // Search filter
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.statusIds.length > 0 && task.statusId && !filters.statusIds.includes(task.statusId)) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeIds.length > 0) {
        const taskAssigneeIds = task.assignees?.map(a => a.user.id) || [];
        if (!filters.assigneeIds.some(id => taskAssigneeIds.includes(id))) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Completion filter
      if (filters.completed !== null && task.completed !== filters.completed) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Task operations
  const updateTask = async (taskId: string, data: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...data } : task
    ));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Failed to update task");

      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      // Revert optimistic update on error
      await fetchTasks();
    }
  };

  const moveTask = async (taskId: string, statusId: string, targetTaskId?: string) => {
    // Find the task being moved
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    // Optimistic update
    const oldStatusId = taskToMove.statusId;
    const isStatusChange = oldStatusId !== statusId;

    // Update the task in the local state
    setTasks(prev => {
      // Create a new array with the task moved to its new position
      const newTasks = prev.map(task =>
        task.id === taskId ? { ...task, statusId } : task
      );

      // If we're just reordering within the same status and have a target task,
      // we can also update the order optimistically
      if (!isStatusChange && targetTaskId) {
        // This is a simplified version of the reordering logic
        // A more accurate implementation would calculate proper order values
        const tasksInStatus = newTasks.filter(t => t.statusId === statusId && t.id !== taskId);
        const targetIndex = tasksInStatus.findIndex(t => t.id === targetTaskId);

        // Reorder the tasks array (this is just for visual feedback, the actual order
        // will be determined by the server)
        if (targetIndex !== -1) {
          // This is a simplified approach - in reality, the server will handle the actual ordering
          console.log("Optimistically reordering tasks");
        }
      }

      return newTasks;
    });

    try {
      // If the status changed, update the task status
      if (isStatusChange) {
        console.log("Updating task status:", { taskId, oldStatusId, newStatusId: statusId });

        const statusResponse = await fetch(`/api/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId })
        });

        if (!statusResponse.ok) throw new Error("Failed to update task status");
      }

      // If there's a target task or we're changing status, reorder
      if (targetTaskId || isStatusChange) {
        console.log("Reordering task:", { taskId, targetTaskId, isSameParentReorder: !isStatusChange });

        await taskApi.reorderTask(
          taskId,
          null, // newParentId
          null, // oldParentId
          targetTaskId, // targetTaskId
          !isStatusChange // isSameParentReorder - true if we're not changing status
        );
      }

      // Show appropriate toast message
      if (isStatusChange) {
        toast({
          title: "Task moved",
          description: `Task moved to ${statuses.find(s => s.id === statusId)?.name || 'new status'}`,
        });
      } else {
        toast({
          title: "Task reordered",
          description: "Task position updated",
        });
      }

      // Refresh to get the updated order
      await fetchTasks();
    } catch (error) {
      console.error("Error moving task:", error);
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive",
      });
      // Revert optimistic update on error
      await fetchTasks();
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update - just toggle the completed field
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        // Toggle completed state
        const newCompleted = !t.completed;
        return {
          ...t,
          completed: newCompleted
        };
      }
      return t;
    }));

    try {
      // Use the toggle-completion endpoint
      const response = await fetch(`/api/tasks/${taskId}/toggle-completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update task");
      }

      // Get the updated task
      const data = await response.json();
      const isCompleted = data.task?.completed || false;

      toast({
        title: `Task marked as ${isCompleted ? "completed" : "incomplete"}`,
        description: "Task status updated successfully",
      });

      // Refresh tasks to ensure UI is in sync with server
      await fetchTasks();
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
      // Revert optimistic update on error
      await fetchTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic update
    setTasks(prev => prev.filter(task => task.id !== taskId));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
      // Revert optimistic update on error
      await fetchTasks();
    }
  };

  const updateTaskAssignees = async (taskId: string, assigneeIds: string[]) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeIds })
      });

      if (!response.ok) throw new Error("Failed to update task assignees");

      // Refresh tasks to get updated assignees
      await fetchTasks();

      toast({
        title: "Assignees updated",
        description: "Task assignees have been updated",
      });
    } catch (error) {
      console.error("Error updating assignees:", error);
      toast({
        title: "Error",
        description: "Failed to update assignees",
        variant: "destructive",
      });
    }
  };

  const createTask = async (data: any) => {
    try {
      const response = await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Failed to create task");

      // Refresh tasks
      await fetchTasks();

      toast({
        title: "Task created",
        description: "New task has been created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  // Function to trigger task editing
  const editTask = (taskId: string) => {
    // This will be implemented by the parent component
    // We just provide the method signature here
  };

  // Initial data load
  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  // Listen for refresh events from task form
  useEffect(() => {
    const handleRefreshTasks = (event: any) => {
      // Check if this event is for our project
      if (event.detail?.projectId === projectId) {
        console.log("TaskContext received refresh event for project:", projectId);
        fetchTasks();
      }
    };

    // Add event listener
    window.addEventListener('refreshTasks', handleRefreshTasks);

    // Clean up
    return () => {
      window.removeEventListener('refreshTasks', handleRefreshTasks);
    };
  }, [projectId]);

  return (
    <TaskContext.Provider value={{
      tasks,
      statuses,
      isLoading,
      isTasksLoading,
      filteredTasks,
      filters,
      setFilters,
      refreshTasks: fetchTasks,
      updateTask,
      moveTask,
      toggleTaskCompletion,
      deleteTask,
      updateTaskAssignees,
      createTask,
      editTask,
      users,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}
