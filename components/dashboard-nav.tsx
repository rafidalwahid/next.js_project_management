import type React from "react"
import Link from "next/link"
import { BarChart3, Calendar, CheckSquare, Clock, FileText, Home, KanbanSquare, Settings, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardNav({ className, ...props }: NavProps) {
  return (
    <div className={cn("flex flex-col gap-2 p-4", className)} {...props}>
      <Link href="/dashboard">
        <Button variant="ghost" className="w-full justify-start">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/projects">
        <Button variant="ghost" className="w-full justify-start">
          <FileText className="mr-2 h-4 w-4" />
          Projects
        </Button>
      </Link>
      <Link href="/tasks">
        <Button variant="ghost" className="w-full justify-start">
          <CheckSquare className="mr-2 h-4 w-4" />
          Tasks
        </Button>
      </Link>
      <Link href="/kanban">
        <Button variant="ghost" className="w-full justify-start">
          <KanbanSquare className="mr-2 h-4 w-4" />
          Kanban
        </Button>
      </Link>
      <Link href="/team">
        <Button variant="ghost" className="w-full justify-start">
          <Users className="mr-2 h-4 w-4" />
          Team
        </Button>
      </Link>
      <Link href="/calendar">
        <Button variant="ghost" className="w-full justify-start">
          <Calendar className="mr-2 h-4 w-4" />
          Calendar
        </Button>
      </Link>
      <Link href="/resources">
        <Button variant="ghost" className="w-full justify-start">
          <Clock className="mr-2 h-4 w-4" />
          Resources
        </Button>
      </Link>
      <Link href="/analytics">
        <Button variant="ghost" className="w-full justify-start">
          <BarChart3 className="mr-2 h-4 w-4" />
          Analytics
        </Button>
      </Link>
      <Link href="/settings">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>
    </div>
  )
}
