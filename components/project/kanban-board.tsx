'use client';

import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CreateStatusDialogNew } from '@/components/project/create-status-dialog';
import { QuickTaskDialogNew } from '@/components/project/quick-task-dialog';

interface KanbanBoardProps {
  projectId: string;
  onEditTask?: (taskId: string) => void;
}

export function KanbanBoard({ projectId, onEditTask }: KanbanBoardProps) {
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState<string>('');
  const [deleteStatusId, setDeleteStatusId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);

  // Check if scrolling is needed
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    }
  };

  // Set up scroll checking
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      checkScrollButtons();
      scrollContainer.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [statuses.length]);

  // Focus input when editing status
  useEffect(() => {
    if (editingStatusId && statusInputRef.current) {
      statusInputRef.current.focus();
    }
  }, [editingStatusId]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Group tasks by status
  const getTasksByStatus = (statusId: string) => {
    return tasks.filter(task => task.statusId === statusId).sort((a, b) => a.order - b.order);
  };

  // Handle task drag and drop
  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    // Get the task that was dragged
    const taskId = draggableId;

    // Get the tasks in the source status
    const tasksInSourceStatus = getTasksByStatus(source.droppableId);

    // Remove the dragged task from the array for accurate target determination
    const draggedTask = tasksInSourceStatus.find(t => t.id === taskId);
    const tasksWithoutDragged = tasksInSourceStatus.filter(t => t.id !== taskId);

    // If the status changed (moved to a different column)
    if (source.droppableId !== destination.droppableId) {
      // Get tasks in destination status
      const tasksInDestination = getTasksByStatus(destination.droppableId);

      // Find target task if any
      let targetTaskId = null;

      if (destination.index < tasksInDestination.length) {
        targetTaskId = tasksInDestination[destination.index].id;
      }

      // Move the task
      await moveTask(taskId, destination.droppableId, targetTaskId);
    }
    // Handle reordering within the same column
    else {
      // Find the target task based on the destination index
      let targetTaskId = null;

      if (destination.index < tasksWithoutDragged.length) {
        // If moving to a position that has a task, use that task's ID as the target
        targetTaskId = tasksWithoutDragged[destination.index].id;
      }

      console.log('Reordering within same column:', {
        taskId,
        statusId: source.droppableId,
        sourceIndex: source.index,
        destinationIndex: destination.index,
        targetTaskId,
      });

      // Move the task (same status, just reordering)
      await moveTask(taskId, source.droppableId, targetTaskId);
    }
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

  if (statuses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center mb-4">
            No statuses defined for this project. Create statuses to start organizing tasks.
          </p>
          <CreateStatusDialogNew projectId={projectId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Left scroll button */}
      {showLeftScroll && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-xs rounded-full shadow-md"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Right scroll button */}
      {showRightScroll && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-xs rounded-full shadow-md"
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Scroll indicator */}
      {showRightScroll && (
        <div className="absolute right-10 bottom-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full opacity-70">
          Scroll for more columns
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className="h-auto max-h-[calc(100vh-240px)] min-h-[350px] xs:min-h-[400px] sm:min-h-[500px] overflow-hidden relative"
          style={{ contain: 'paint' }}
        >
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto pb-4 gap-2 xs:gap-3 sm:gap-4 md:gap-6 h-full pr-2 sm:pr-4 pl-1 -ml-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent touch-pan-x no-scrollbar"
            aria-label="Kanban board columns"
          >
            {statuses
              .sort((a, b) => a.order - b.order)
              .map(status => (
                <Droppable key={status.id} droppableId={status.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'shrink-0 w-[220px] xs:w-[260px] sm:w-[300px] md:w-[320px] h-full flex flex-col rounded-md',
                        snapshot.isDraggingOver && 'ring-2 ring-primary ring-opacity-50'
                      )}
                    >
                      <div
                        className="flex items-center justify-between p-3 rounded-t-md"
                        style={{ backgroundColor: status.color + '20' }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: status.color }}
                          />

                          {editingStatusId === status.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={statusInputRef}
                                value={editingStatusName}
                                onChange={e => setEditingStatusName(e.target.value)}
                                className="h-7 w-[120px] py-1 px-2 text-sm"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleSaveStatusName();
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleSaveStatusName}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <h3 className="font-medium truncate">{status.name}</h3>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditStatus(status)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteStatusId(status.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <QuickTaskDialogNew
                            projectId={projectId}
                            statusId={status.id}
                            statusName={status.name}
                            onTaskCreated={refreshTasks}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 bg-muted/20 rounded-b-md p-2 overflow-y-auto">
                        <div className="space-y-2">
                          {getTasksByStatus(status.id).map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="touch-manipulation"
                                >
                                  <TaskCard
                                    task={task}
                                    isDragging={snapshot.isDragging}
                                    onToggleComplete={toggleTaskCompletion}
                                    onEdit={onEditTask}
                                    onDelete={taskId => setDeleteTaskId(taskId)}
                                    onUpdateAssignees={updateTaskAssignees}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {getTasksByStatus(status.id).length === 0 && (
                            <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-muted-foreground/20 rounded-md p-4">
                              <p className="text-sm text-muted-foreground text-center">
                                No tasks in this status
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                Drag tasks here or use the + button to add a new task
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
          </div>
        </div>
      </DragDropContext>

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
