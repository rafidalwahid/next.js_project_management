'use client';

import { Plus, Search, Filter, ArrowDownAZ, Flag, CircleDotDashed, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from '@/components/tasks/task-list';
import { Pagination } from '@/components/tasks/pagination';
import { useTasks } from '@/hooks/use-data';
import { taskApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/use-users';
import type { Task } from '@/components/tasks/task-list';
import { TaskCreateModal } from '@/components/modals/task-create-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KanbanBoard } from '@/components/project/kanban-board';
import { useTaskContext } from '@/hooks/use-task-context';
import { TaskProvider } from '@/components/project/task-context';

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State with URL params as defaults
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [priorityFilter, setPriorityFilter] = useState<string>(
    searchParams.get('priority') || 'all'
  );
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>(
    searchParams.get('assignee') || 'all'
  );
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'dueDate');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const itemsPerPage = 12;
  const { tasks: allTasks, isLoading, isError, mutate } = useTasks(1, 100); // Increased limit
  const { users, isLoading: usersLoading } = useUsers({ limit: 100 }); // Fetch all users
  const { toast } = useToast();

  // We'll use TaskContext inside the TaskProvider

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    if (teamMemberFilter !== 'all') params.set('assignee', teamMemberFilter);
    if (sortBy !== 'dueDate') params.set('sort', sortBy);
    if (currentPage !== 1) params.set('page', currentPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '/tasks', { scroll: false });
  }, [searchQuery, priorityFilter, teamMemberFilter, sortBy, currentPage, router]);

  // Filter tasks by priority, team member, and search query
  const filteredTasks = allTasks.filter((task: Task) => {
    const matchesPriority =
      priorityFilter === 'all' || task.priority.toLowerCase() === priorityFilter.toLowerCase();

    // Check if task is assigned to the selected team member
    const matchesTeamMember =
      teamMemberFilter === 'all' ||
      (task.assignees && task.assignees.some(assignee => assignee.user.id === teamMemberFilter));

    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesPriority && matchesTeamMember && matchesSearch;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] -
        priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder]
      );
    } else if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = sortedTasks.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // No longer needed - removed status filter

  const deleteTask = async (id: string) => {
    try {
      await taskApi.deleteTask(id);
      mutate(); // Refresh the data
      toast({
        title: 'Task deleted',
        description: 'The task has been deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete the task',
        variant: 'destructive',
      });
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    try {
      // Find the task to get its current completion state
      const task = allTasks.find(t => t.id === id);
      if (!task) return;

      // Optimistic update
      mutate(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)),
        };
      }, false);

      // Call the API to toggle completion
      const response = await fetch(`/api/tasks/${id}/toggle-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to update task completion');
      }

      // Show success message
      toast({
        title: `Task marked as ${!task.completed ? 'completed' : 'incomplete'}`,
        description: 'Task status updated successfully',
      });

      // Refresh data
      mutate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task completion status',
        variant: 'destructive',
      });
      // Refresh to revert optimistic update
      mutate();
    }
  };

  // Show loading state when loading data
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-destructive">Error loading tasks. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Define the handleError function that was missing
  const handleError = (error: any) => {
    console.error('Task operation error:', error);
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'An error occurred with the task operation',
      variant: 'destructive',
    });
  };

  return (
    <div className="h-full">
      <TaskProvider projectId="all">
        <TaskBoardContent
          router={router}
          deleteTask={deleteTask}
        />
      </TaskProvider>
    </div>
  );
}

// Child component that uses TaskContext within the provider
function TaskBoardContent({
  router,
  deleteTask
}: {
  router: any;
  deleteTask: (id: string) => Promise<void>;
}) {
  // Now we can safely use the TaskContext because we're inside the provider
  const {
    moveTask,
    toggleTaskCompletion,
    updateTaskAssignees,
    refreshTasks
  } = useTaskContext();

  // Define the handleAddTask function
  const handleAddTask = (statusId: string) => {
    // Navigate to create task page with status pre-selected
    router.push(`/tasks/new?status=${statusId}`);
  };

  return (
    <KanbanBoard
      projectId="all"
      onAddTask={handleAddTask}
      onEditTask={(taskId) => router.push(`/tasks/${taskId}`)}
      onDeleteTask={deleteTask}
      showAddButton={true}
      emptyStateMessage="No tasks in this column"
    />
  );
}
