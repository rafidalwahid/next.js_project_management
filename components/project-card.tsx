import { Clock, Users, Calendar, MoreHorizontal } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Status {
  id: string
  name: string
  color: string
}

interface ProjectCardProps {
  title: string
  description: string
  progress: number
  dueDate: string
  team: number
  tasks: number
  completedTasks: number
  status?: Status // Primary status
  statuses?: Status[] // Additional statuses
}

export function ProjectCard({
  title,
  description,
  progress,
  dueDate,
  team,
  tasks,
  completedTasks,
  status,
  statuses = [],
}: ProjectCardProps) {
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-emerald-500"
    if (progress >= 50) return "bg-blue-500"
    if (progress >= 25) return "bg-amber-500"
    return "bg-rose-500"
  }

  const getBadgeVariant = (progress: number) => {
    if (progress >= 75) return "success"
    if (progress >= 50) return "default"
    if (progress >= 25) return "warning"
    return "destructive"
  }

  return (
    <div className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getBadgeVariant(progress)}>{progress}%</Badge>
            {/* Display statuses */}
            <div className="flex flex-wrap gap-1 justify-end">
              {status && (
                <div
                  className="px-2 py-0.5 text-xs rounded-full border flex items-center gap-1"
                  style={{ borderColor: status.color, color: status.color }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                  {status.name}
                </div>
              )}
              {statuses.map(s => (
                <div
                  key={s.id}
                  className="px-2 py-0.5 text-xs rounded-full border flex items-center gap-1"
                  style={{ borderColor: s.color, color: s.color }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedTasks}/{tasks} tasks
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${getProgressColor(progress)} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{dueDate}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{team} members</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

