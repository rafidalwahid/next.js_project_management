'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  rectIntersection,
  DragOverEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  Pencil,
  Trash,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TaskCard } from './task-card';
import { useTaskContext } from './task-context';
import { Task } from '@/types/task';
import { ProjectStatus } from '@/types/project';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QuickTaskDialogNew } from '@/components/project/quick-task-dialog';

interface StatusListViewProps {
  projectId: string;
  onEditTask?: (taskId: string) => void;
}

// Task item component that can be dragged
function DraggableTaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateAssignees,
}: {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onUpdateAssignees: (taskId: string, assigneeIds: string[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-manipulation">
      <div className="flex items-start gap-2">
        <div {...listeners} className="mt-1 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <TaskCard
            task={task}
            isDragging={isDragging}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateAssignees={onUpdateAssignees}
          />
        </div>
      </div>
    </div>
  );
}

// Status section component with collapsible task list
function StatusSection({
  status,
  tasks,
  onToggleComplete,
  onEdit,
  onCreateTask,
  isOpen,
  onToggle,
  onEditStatus,
  onDeleteStatus,
  onDeleteTask,
  isEditing,
  editingName,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onUpdateAssignees,
}: {
  status: ProjectStatus;
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onCreateTask: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onEditStatus: (status: ProjectStatus) => void;
  onDeleteStatus: (statusId: string) => void;
  onDeleteTask: (taskId: string) => void;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUpdateAssignees: (taskId: string, assigneeIds: string[]) => void;
}) {
  // Reference for the status input field
  const statusInputRef = useRef<HTMLInputElement>(null);

  // Make the status section a droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status.id}`,
    data: {
      type: 'status',
      status,
    },
  });

  // Force the section to be open when dragging over it
  useEffect(() => {
    if (isOver && !isOpen) {
      onToggle();
    }
  }, [isOver, isOpen, onToggle]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className={cn('mb-4', isOver && 'ring-2 ring-primary ring-offset-2')}
    >
      <div
        className="flex items-center justify-between rounded-t-md p-3"
        style={{ backgroundColor: status.color + '20' }}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: status.color }}
          />

          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                ref={statusInputRef}
                value={editingName}
                onChange={e => onEditingNameChange(e.target.value)}
                className="h-7 w-[120px] py-1 px-2 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onSaveEdit();
                  } else if (e.key === 'Escape') {
                    onCancelEdit();
                  }
                }}
              />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSaveEdit}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <h3 className="font-medium truncate">{status.name}</h3>
          )}

          <div className="flex items-center justify-center h-5 min-w-6 px-1.5 text-xs font-medium rounded-full bg-muted">
            {tasks.length}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditStatus(status)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteStatus(status.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <QuickTaskDialogNew
            projectId={status.projectId}
            statusId={status.id}
            statusName={status.name}
            onTaskCreated={onCreateTask}
          />
        </div>
      </div>
      <CollapsibleContent>
        <div
          ref={setNodeRef}
          className={cn(
            'rounded-b-md border border-t-0 p-2 min-h-[100px] transition-colors duration-200',
            isOver
              ? 'bg-primary/10 border-primary/30 border-2'
              : tasks.length === 0
                ? 'bg-muted/20 border-dashed border-2'
                : ''
          )}
          data-status-id={status.id}
          data-droppable="true"
        >
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-sm">
              <div
                className={cn(
                  'p-4 rounded-md border-2',
                  isOver
                    ? 'border-primary bg-primary/5'
                    : 'border-dashed border-muted-foreground/30'
                )}
              >
                <p className={isOver ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  No tasks in this status
                </p>
              </div>
            </div>
          ) : (
            <SortableContext
              items={tasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {tasks.map(task => (
                  <DraggableTaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDeleteTask}
                    onUpdateAssignees={onUpdateAssignees}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function StatusListView({ projectId, onEditTask }: StatusListViewProps) {
  const {
    tasks,
    statuses,
    isLoading,
    refreshTasks,
    toggleTaskCompletion,
    deleteTask,
    updateTaskAssignees,
    moveTask,
  } = useTaskContext();

  const [openStatuses, setOpenStatuses] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState<string>('');
  const [deleteStatusId, setDeleteStatusId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Initialize open states based on user preference or default
  useEffect(() => {
    // Try to load from localStorage
    try {
      const savedState = localStorage.getItem(`project-${projectId}-open-statuses`);
      if (savedState) {
        setOpenStatuses(JSON.parse(savedState));
        // Check if all are closed to set expandAll state
        const allStatuses = JSON.parse(savedState);
        const allClosed = Object.values(allStatuses).every(v => !v);
        setExpandAll(!allClosed);
      } else {
        // Default: open all statuses
        const initialState: Record<string, boolean> = {};
        statuses.forEach(status => {
          initialState[status.id] = true;
        });
        setOpenStatuses(initialState);
      }
    } catch (e) {
      console.error('Error loading saved status states:', e);
      // Fallback to all open
      const initialState: Record<string, boolean> = {};
      statuses.forEach(status => {
        initialState[status.id] = true;
      });
      setOpenStatuses(initialState);
    }
  }, [statuses, projectId]);

  // Save open states to localStorage when changed
  useEffect(() => {
    if (Object.keys(openStatuses).length > 0) {
      localStorage.setItem(`project-${projectId}-open-statuses`, JSON.stringify(openStatuses));
    }
  }, [openStatuses, projectId]);

  // Toggle a single status
  const toggleStatus = (statusId: string) => {
    setOpenStatuses(prev => {
      const newState = { ...prev, [statusId]: !prev[statusId] };
      // Check if all are now closed/open to update expandAll state
      const allClosed = Object.values(newState).every(v => !v);
      setExpandAll(!allClosed);
      return newState;
    });
  };

  // Toggle all statuses
  const toggleAllStatuses = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);

    const newState: Record<string, boolean> = {};
    statuses.forEach(status => {
      newState[status.id] = newExpandAll;
    });
    setOpenStatuses(newState);
  };

  // Group tasks by status
  const getTasksByStatus = (statusId: string) => {
    return tasks.filter(task => task.statusId === statusId).sort((a, b) => a.order - b.order);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
    }
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveStatusId(null);
      return;
    }

    // If hovering over a status
    if (over.data.current?.type === 'status') {
      const statusId = over.data.current.status.id;
      setActiveStatusId(statusId);
    }
    // If hovering over another task
    else if (over.data.current?.type === 'task') {
      const task = over.data.current.task;
      setActiveStatusId(task.statusId);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      setActiveStatusId(null);
      return;
    }

    const draggedTask = active.data.current?.task as Task;
    if (!draggedTask) {
      setActiveTask(null);
      setActiveStatusId(null);
      return;
    }

    // If dropping onto a status
    if (over.data.current?.type === 'status') {
      const newStatusId = over.data.current.status.id;

      // If the status is changing
      if (draggedTask.statusId !== newStatusId) {
        await moveTask(draggedTask.id, newStatusId);
      }
    }
    // If dropping onto another task
    else if (over.data.current?.type === 'task') {
      const targetTask = over.data.current.task as Task;

      // If the status is changing
      if (draggedTask.statusId !== targetTask.statusId) {
        await moveTask(draggedTask.id, targetTask.statusId, targetTask.id);
      }
      // If just reordering within the same status
      else if (draggedTask.id !== targetTask.id) {
        await moveTask(draggedTask.id, targetTask.statusId, targetTask.id);
      }
    }

    setActiveTask(null);
    setActiveStatusId(null);
  };

  // Start editing a status
  const handleEditStatus = (status: ProjectStatus) => {
    setEditingStatusId(status.id);
    setEditingStatusName(status.name);
  };

  // Save edited status
  const handleSaveStatusName = async () => {
    if (!editingStatusId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/statuses/${editingStatusId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingStatusName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh tasks to get updated status
      await refreshTasks();

      // Reset editing state
      setEditingStatusId(null);
      setEditingStatusName('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingStatusId(null);
    setEditingStatusName('');
  };

  // Delete status
  const handleDeleteStatus = async () => {
    if (!deleteStatusId) return;

    try {
      // Check if status has tasks
      const tasksInStatus = tasks.filter(task => task.statusId === deleteStatusId);

      if (tasksInStatus.length > 0) {
        setDeleteStatusId(null);
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/statuses/${deleteStatusId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete status');
      }

      // Refresh tasks to get updated statuses
      await refreshTasks();
    } catch (error) {
      console.error('Error deleting status:', error);
    } finally {
      setDeleteStatusId(null);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      await deleteTask(deleteTaskId);
    } finally {
      setDeleteTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center mb-2">
        <Button variant="outline" size="sm" onClick={toggleAllStatuses} className="text-xs">
          {expandAll ? (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronRight className="h-3.5 w-3.5 mr-1" />
              Expand All
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          {tasks.length} tasks in {statuses.length} statuses
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {statuses
          .sort((a, b) => a.order - b.order)
          .map(status => (
            <StatusSection
              key={status.id}
              status={status}
              tasks={getTasksByStatus(status.id)}
              onToggleComplete={toggleTaskCompletion}
              onEdit={onEditTask}
              onCreateTask={refreshTasks}
              isOpen={!!openStatuses[status.id]}
              onToggle={() => toggleStatus(status.id)}
              onEditStatus={handleEditStatus}
              onDeleteStatus={statusId => setDeleteStatusId(statusId)}
              onDeleteTask={taskId => setDeleteTaskId(taskId)}
              isEditing={editingStatusId === status.id}
              editingName={editingStatusName}
              onEditingNameChange={setEditingStatusName}
              onSaveEdit={handleSaveStatusName}
              onCancelEdit={handleCancelEdit}
              onUpdateAssignees={updateTaskAssignees}
            />
          ))}

        {/* Drag overlay for the currently dragged task */}
        <DragOverlay>
          {activeTask && (
            <div className="rounded-md border bg-background p-3 shadow-md w-full max-w-md opacity-90">
              <div className="flex items-center gap-2">
                <Checkbox checked={activeTask.completed} />
                <span
                  className={
                    activeTask.completed ? 'line-through text-muted-foreground' : 'font-medium'
                  }
                >
                  {activeTask.title}
                </span>
              </div>
              {activeStatusId && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Moving to: {statuses.find(s => s.id === activeStatusId)?.name || 'new status'}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Delete status confirmation dialog */}
      <AlertDialog open={!!deleteStatusId} onOpenChange={() => setDeleteStatusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this status? This action cannot be undone.
              {tasks.some(task => task.statusId === deleteStatusId) && (
                <p className="text-destructive mt-2 font-medium">
                  This status contains tasks. Move or delete them first.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStatus}
              disabled={tasks.some(task => task.statusId === deleteStatusId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete task confirmation dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
