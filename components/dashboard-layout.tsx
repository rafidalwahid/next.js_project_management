"use client"

import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { PanelLeft, PanelLeftClose } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // No need for header padding updates anymore

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 relative">
        <aside className="fixed left-0 top-0 bottom-0 z-30 hidden border-r bg-muted/40 md:flex flex-col h-screen overflow-hidden" style={{ width: sidebarCollapsed ? '64px' : '240px' }}>
          <div className={cn(
            "flex items-center h-14 border-b bg-muted/60 backdrop-blur",
            sidebarCollapsed ? "justify-center px-2" : "px-4"
          )}>
            {sidebarCollapsed ? (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center h-8 w-8 p-0 rounded-md bg-background/80 hover:bg-background"
                onClick={toggleSidebar}
                aria-label="Panel Left Open"
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Panel Left Open</span>
              </Button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <span className="font-semibold">Project Management</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center h-8 w-8 p-0 rounded-md bg-background/80 hover:bg-background ml-2"
                  onClick={toggleSidebar}
                  aria-label="Panel Left Close"
                >
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="sr-only">Panel Left Close</span>
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
            <DashboardNav collapsed={sidebarCollapsed} />
          </div>
          <div className="border-t bg-muted/60 backdrop-blur">
            <div className={cn(
              "flex items-center py-3",
              sidebarCollapsed ? "justify-center px-2" : "px-4 justify-start"
            )}>
              <UserNav compact={sidebarCollapsed} showName={!sidebarCollapsed} />
            </div>
          </div>
        </aside>
        <main className="flex flex-col gap-6 p-6 transition-all duration-300 ease-in-out min-h-screen" style={{ marginLeft: sidebarCollapsed ? '64px' : '240px' }}>
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  )
}
