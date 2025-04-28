"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

interface ProjectStatus {
  id: string
  name: string
  color: string
  description?: string | null
  order: number
  isDefault: boolean
}

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface TaskFormProps {
  projectId: string
  taskId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  estimatedTime: z.union([
    z.coerce.number().min(0).optional().nullable(),
    z.literal("")
  ]).optional().nullable().transform(val => val === "" ? null : val),
  timeSpent: z.union([
    z.coerce.number().min(0).optional().nullable(),
    z.literal("")
  ]).optional().nullable().transform(val => val === "" ? null : val),
  statusId: z.string().optional().nullable(),
  // assignedToId is completely deprecated - not included in the schema
  // Use assigneeIds as the primary way to assign tasks
  assigneeIds: z.array(z.string()).optional(),
  parentId: z.string().optional().nullable(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

export function TaskForm({ projectId, taskId, onSuccess, onCancel }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(!!taskId)
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [parentTasks, setParentTasks] = useState<{ id: string; title: string }[]>([])
  const { toast } = useToast()

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      startDate: null,
      endDate: null,
      dueDate: null,
      estimatedTime: null,
      timeSpent: null,
      statusId: null,
      assigneeIds: [],
      parentId: null,
    },
  })

  // Fetch project statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/statuses`)
        if (!response.ok) throw new Error("Failed to fetch statuses")

        const data = await response.json()
        setStatuses(data.statuses || [])

        // Set default status if available and creating a new task
        if (!taskId && data.statuses && data.statuses.length > 0) {
          const defaultStatus = data.statuses.find((s: ProjectStatus) => s.isDefault)
          form.setValue("statusId", defaultStatus ? defaultStatus.id : data.statuses[0].id)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch project statuses",
          variant: "destructive",
        })
      }
    }

    if (projectId) {
      fetchStatuses()
    }
  }, [projectId, taskId])

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/team`)
        if (!response.ok) throw new Error("Failed to fetch team members")

        const data = await response.json()

        if (data.teamMembers && Array.isArray(data.teamMembers)) {
          // Extract user data from team members and filter out any null values
          const users = data.teamMembers
            .map((tm: any) => tm.user)
            .filter((user: any) => user && user.id);

          console.log(`Fetched ${users.length} team members for task assignment`);
          setTeamMembers(users);
        } else {
          console.error("No team members data found:", data);
          setTeamMembers([]);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error",
          description: "Failed to fetch team members",
          variant: "destructive",
        })
      }
    }

    if (projectId) {
      fetchTeamMembers()
    }
  }, [projectId])

  // Fetch parent tasks (top-level tasks for this project)
  useEffect(() => {
    const fetchParentTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?projectId=${projectId}&parentId=null`)
        if (!response.ok) throw new Error("Failed to fetch tasks")

        const data = await response.json()
        // Filter out the current task if editing
        const filteredTasks = taskId
          ? data.tasks.filter((t: any) => t.id !== taskId)
          : data.tasks

        setParentTasks(filteredTasks.map((t: any) => ({ id: t.id, title: t.title })))
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch potential parent tasks",
          variant: "destructive",
        })
      }
    }

    if (projectId) {
      fetchParentTasks()
    }
  }, [projectId, taskId])

  // Fetch task data if editing
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return

      try {
        setIsFetching(true)
        const response = await fetch(`/api/tasks/${taskId}`)
        if (!response.ok) throw new Error("Failed to fetch task")

        const data = await response.json()
        const task = data.task

        console.log("Fetched task data:", task);

        // Extract assignee IDs from the task
        const assigneeIds = task.assignees?.map((a: any) => a.userId) || [];
        console.log("Extracted assignee IDs:", assigneeIds);

        if (task) {
          form.reset({
            title: task.title,
            description: task.description || "",
            priority: task.priority,
            startDate: task.startDate ? new Date(task.startDate) : null,
            endDate: task.endDate ? new Date(task.endDate) : null,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            estimatedTime: task.estimatedTime,
            timeSpent: task.timeSpent,
            statusId: task.statusId,
            assigneeIds: assigneeIds,
            parentId: task.parentId,
          })
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        toast({
          title: "Error",
          description: "Failed to fetch task details",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    if (taskId) {
      fetchTask()
    }
  }, [taskId])

  const onSubmit = async (values: TaskFormValues) => {
    try {
      setIsLoading(true)

      const endpoint = taskId
        ? `/api/tasks/${taskId}`
        : "/api/tasks"

      const method = taskId ? "PATCH" : "POST"

      // Format data for submission
      const payload = {
        ...values,
        projectId: !taskId ? projectId : undefined,
        // Ensure these are properly formatted for the API
        estimatedTime: values.estimatedTime === "" ? null : values.estimatedTime,
        timeSpent: values.timeSpent === "" ? null : values.timeSpent,
        // Format dates
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      }

      // Log assignee information
      console.log("Assignee IDs being submitted:", values.assigneeIds);
      console.log("Team members available:", teamMembers.map(m => ({ id: m.id, name: m.name || m.email })));
      console.log("Submitting task data:", payload)

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save task")
      }

      toast({
        title: taskId ? "Task updated" : "Task created",
        description: taskId
          ? "The task has been updated successfully"
          : "The task has been created successfully",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save task",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Task description"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal w-full",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200]" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date) => {
                        field.onChange(date);
                      }}
                      disabled={(date) => false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal w-full",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200]" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date) => {
                        field.onChange(date);
                      }}
                      disabled={(date) => false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal w-full",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200]" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date) => {
                        field.onChange(date);
                      }}
                      disabled={(date) => false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="estimatedTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Time (hours)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      {...field}
                      value={field.value === null ? "" : field.value}
                    />
                    <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeSpent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Spent (hours)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      {...field}
                      value={field.value === null ? "" : field.value}
                    />
                    <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assigneeIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignees</FormLabel>
              <FormControl>
                <MultiSelect
                  options={teamMembers.map((member) => ({
                    label: member.name || member.email,
                    value: member.id,
                  }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select assignees"
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {parentTasks.length > 0 && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Task (optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent task" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None (Top-level task)</SelectItem>
                    {parentTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Making this a subtask will nest it under the selected parent task.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {taskId ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
