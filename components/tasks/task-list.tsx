'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Edit,
  Trash,
  MoreHorizontal,
  CheckCircle2,
  ArrowUpDown,
  Circle,
  CircleDotDashed,
  CircleCheck,
  Calendar,
} from 'lucide-react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Task, TaskAssignee } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  onDelete: (taskId: string) => void;
  onToggleCompletion?: (taskId: string) => void;
}

// --- Helper Functions ---

const getUserInitials = (name: string | null) => {
  if (!name) return 'U';
  const nameParts = name.split(' ');
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getPriorityBadgeVariant = (
  priority: string
): 'destructive' | 'warning' | 'outline' | 'secondary' => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'warning'; // Using warning color for medium
    case 'low':
      return 'secondary'; // Using secondary for low
    default:
      return 'outline';
  }
};

const getStatusBadgeVariant = (
  statusName: string | undefined | null
): 'outline' | 'secondary' | 'success' => {
  switch (statusName?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'in-progress':
      return 'secondary';
    case 'pending':
      return 'outline';
    // Add other fallback variants if needed
    default:
      return 'outline';
  }
};

const getStatusIcon = (statusName: string | undefined | null) => {
  switch (statusName?.toLowerCase()) {
    case 'pending':
      return <Circle className="mr-1.5 h-3 w-3 text-muted-foreground" />;
    case 'in-progress':
      return <CircleDotDashed className="mr-1.5 h-3 w-3 text-yellow-600" />;
    case 'completed':
      return <CircleCheck className="mr-1.5 h-3 w-3 text-green-600" />;
    // Add more cases based on actual status names if needed
    default:
      return <Circle className="mr-1.5 h-3 w-3 text-muted-foreground" />;
  }
};

// --- Column Definitions for React Table ---

const columns = (
  onDelete: (taskId: string) => void,
  onToggleCompletion?: (taskId: string) => void
): ColumnDef<Task>[] => [
  {
    id: 'completed',
    header: '',
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 p-0', task.completed && 'text-green-500')}
            onClick={() => onToggleCompletion?.(task.id)}
            disabled={!onToggleCompletion}
          >
            {task.completed ? <CircleCheck className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            <span className="sr-only">
              {task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            </span>
          </Button>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="flex flex-col">
          <Link
            href={`/tasks/${task.id}`}
            className={cn(
              'font-medium hover:text-primary hover:underline max-w-[250px] md:max-w-[350px] lg:max-w-[450px] truncate',
              task.completed && 'line-through text-muted-foreground'
            )}
            title={task.title}
          >
            {task.title}
          </Link>
          {task.description && (
            <p
              className={cn(
                'text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-[250px] md:max-w-[350px] lg:max-w-[450px]',
                task.completed && 'line-through'
              )}
            >
              {task.description}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const statusName = status?.name;
      const statusColor = status?.color;

      const baseBadgeClasses =
        'capitalize whitespace-nowrap flex items-center w-fit text-xs font-medium border';

      const dynamicStyle: React.CSSProperties = statusColor
        ? {
            backgroundColor: `${statusColor}1A`,
            borderColor: `${statusColor}4D`,
            color: statusColor,
          }
        : {};

      return (
        <Badge
          style={statusColor ? dynamicStyle : {}}
          variant={!statusColor ? getStatusBadgeVariant(statusName) : null}
          className={cn(
            baseBadgeClasses,
            !statusColor && 'px-2 py-0.5',
            statusColor && 'px-2 py-0.5'
          )}
        >
          {getStatusIcon(statusName)}
          {statusName || 'No Status'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'project.title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4 hidden lg:inline-flex"
      >
        Project
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const project = row.original.project;
      return project ? (
        <Link
          href={`/projects/${project.id}`}
          className="text-sm hover:underline whitespace-nowrap max-w-[120px] lg:max-w-[180px] truncate block"
          title={project.title}
        >
          {project.title}
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      );
    },
    sortingFn: 'alphanumeric',
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Priority
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge
        variant={getPriorityBadgeVariant(row.original.priority)}
        className="capitalize whitespace-nowrap text-xs font-medium"
      >
        {row.original.priority}
      </Badge>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4 hidden md:inline-flex"
      >
        Due Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const dueDate = row.original.dueDate;
      return dueDate ? (
        <span className="text-sm whitespace-nowrap">{new Date(dueDate).toLocaleDateString()}</span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      );
    },
  },
  {
    id: 'assignees',
    header: 'Assigned To',
    cell: ({ row }) => {
      const assignees = row.original.assignees;

      if (assignees && assignees.length > 0) {
        const displayCount = 3; // Show first 3 avatars overlapping
        const visibleAssignees = assignees.slice(0, displayCount);
        const hiddenAssignees = assignees.slice(displayCount);
        const remainingCount = hiddenAssignees.length;

        return (
          <TooltipProvider delayDuration={100}>
            {' '}
            {/* Wrap in provider */}
            <div className="flex items-center -space-x-2">
              {' '}
              {/* Revert to negative space */}
              {visibleAssignees.map(assignee => (
                <Tooltip key={assignee.id}>
                  <TooltipTrigger asChild>
                    {/* Remove the inner div and name span */}
                    <Avatar className="h-7 w-7 border-2 border-background cursor-pointer">
                      {' '}
                      {/* Added cursor */}
                      {assignee.user.image ? (
                        <AvatarImage src={assignee.user.image} alt={assignee.user.name || 'User'} />
                      ) : null}
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                        {getUserInitials(assignee.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{assignee.user.name || 'Unnamed User'}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {remainingCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* Tooltip for the count indicator */}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground z-10 cursor-default">
                      +{remainingCount}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {/* List remaining names */}
                    {hiddenAssignees.map(a => a.user.name || 'Unnamed').join(', ')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        );
      } else {
        return <span className="text-sm text-muted-foreground">Unassigned</span>;
      }
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const task = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/tasks/${task.id}`} className="cursor-pointer w-full flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" /> View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/tasks/${task.id}`} className="cursor-pointer w-full flex items-center">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center"
              onClick={() => onDelete(task.id)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];

// --- Main Component ---

export function TaskList({ tasks, onDelete, onToggleCompletion }: TaskListProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: tasks,
    columns: React.useMemo(
      () => columns(onDelete, onToggleCompletion),
      [onDelete, onToggleCompletion]
    ),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const columnCount = React.useMemo(
    () => columns(onDelete, onToggleCompletion).length,
    [onDelete, onToggleCompletion]
  );

  return (
    <div className="rounded-md border shadow-xs overflow-hidden">
      {/* Responsive table with horizontal scrolling on small screens */}
      <div className="hidden sm:block overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'whitespace-nowrap px-3 py-2 text-sm font-medium text-muted-foreground',
                      header.id === 'project.title' && 'hidden lg:table-cell',
                      header.id === 'dueDate' && 'hidden md:table-cell',
                      header.id === 'assignees' && 'hidden md:table-cell',
                      header.id === 'completed' && 'w-10',
                      header.id === 'status' && 'hidden md:table-cell',
                      header.id === 'priority' && 'hidden md:table-cell'
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="group hover:bg-muted/50"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'px-3 py-2.5 text-sm',
                        cell.column.id === 'project.title' && 'hidden lg:table-cell',
                        cell.column.id === 'dueDate' && 'hidden md:table-cell',
                        cell.column.id === 'assignees' && 'hidden md:table-cell',
                        cell.column.id === 'completed' && 'w-10',
                        cell.column.id === 'status' && 'hidden md:table-cell',
                        cell.column.id === 'priority' && 'hidden md:table-cell'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view - card layout for small screens */}
      <div className="sm:hidden">
        {table.getRowModel().rows?.length ? (
          <div className="divide-y">
            {table.getRowModel().rows.map(row => {
              const task = row.original;
              return (
                <div key={task.id} className={cn('p-4 space-y-3', task.completed && 'opacity-70')}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {onToggleCompletion && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-8 w-8 p-0 shrink-0 mt-0.5',
                            task.completed && 'text-green-500'
                          )}
                          onClick={() => onToggleCompletion(task.id)}
                          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {task.completed ? (
                            <CircleCheck className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                      <Link
                        href={`/tasks/${task.id}`}
                        className={cn(
                          'font-medium hover:text-primary hover:underline break-words line-clamp-2',
                          task.completed && 'line-through text-muted-foreground'
                        )}
                        title={task.title}
                      >
                        {task.title}
                      </Link>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/tasks/${task.id}`}
                            className="cursor-pointer w-full flex items-center"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/tasks/${task.id}`}
                            className="cursor-pointer w-full flex items-center"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center"
                          onClick={() => onDelete(task.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {task.description && (
                    <p
                      className={cn(
                        'text-xs text-muted-foreground line-clamp-1',
                        task.completed && 'line-through'
                      )}
                    >
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <Badge
                      variant={getPriorityBadgeVariant(task.priority)}
                      className="capitalize whitespace-nowrap text-xs font-medium"
                    >
                      {task.priority}
                    </Badge>

                    {task.status && (
                      <Badge
                        style={
                          task.status.color
                            ? {
                                backgroundColor: `${task.status.color}1A`,
                                borderColor: `${task.status.color}4D`,
                                color: task.status.color,
                              }
                            : {}
                        }
                        variant={
                          !task.status.color ? getStatusBadgeVariant(task.status.name) : null
                        }
                        className={cn(
                          'capitalize whitespace-nowrap flex items-center w-fit text-xs font-medium border',
                          !task.status.color && 'px-2 py-0.5',
                          task.status.color && 'px-2 py-0.5'
                        )}
                      >
                        {getStatusIcon(task.status.name)}
                        {task.status.name || 'No Status'}
                      </Badge>
                    )}

                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    {task.project && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Project:</span>{' '}
                        <Link href={`/projects/${task.project.id}`} className="hover:underline">
                          {task.project.title}
                        </Link>
                      </div>
                    )}

                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground font-medium">
                          Assigned to:
                        </span>
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map(assignee => (
                            <Avatar key={assignee.id} className="h-5 w-5 border border-background">
                              {assignee.user.image ? (
                                <AvatarImage
                                  src={assignee.user.image}
                                  alt={assignee.user.name || 'User'}
                                />
                              ) : null}
                              <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                {getUserInitials(assignee.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[10px] text-muted-foreground">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No tasks found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
