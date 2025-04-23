"use client"

import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { PanelLeft, PanelLeftClose, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Use localStorage to persist sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false)
    }
  }, [isMobile])

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      const newState = !sidebarCollapsed
      setSidebarCollapsed(newState)
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-3"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <span className="font-semibold">Project Management</span>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-[280px] p-0"
          >
            <div className="flex flex-col h-full">
              <div className="flex h-14 items-center border-b px-6 bg-primary text-primary-foreground">
                <SheetTitle className="font-bold text-lg text-primary-foreground">Project Management</SheetTitle>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-2 p-4">
                  <DashboardNav collapsed={false} />
                </div>
              </div>

              <div className="border-t bg-muted/50 p-4">
                <UserNav
                  showName={true}
                  className="w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 bottom-0 z-30 hidden md:flex flex-col h-screen transition-all duration-300 ease-in-out bg-background border-r",
            sidebarCollapsed ? "w-[64px]" : "w-[280px]"
          )}
        >
          <div className="flex h-14 items-center border-b px-4 bg-primary text-primary-foreground">
            <div className={cn(
              "flex w-full items-center",
              sidebarCollapsed ? "justify-center" : "justify-between"
            )}>
              {!sidebarCollapsed && (
                <span className="font-bold text-lg truncate">
                  Project Management
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 rounded-md"
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className={cn(
              "flex flex-col gap-2",
              sidebarCollapsed ? "px-2 py-4" : "p-4"
            )}>
              <DashboardNav collapsed={sidebarCollapsed} />
            </div>
          </div>

          <div className={cn(
            "border-t bg-muted/50",
            sidebarCollapsed ? "p-2" : "p-4"
          )}>
            <UserNav
              compact={sidebarCollapsed}
              showName={!sidebarCollapsed}
              className={cn(
                "w-full hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                sidebarCollapsed ? "p-2" : "p-3"
              )}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
            isMobile ? "w-full mt-14" : "",
            !isMobile && (sidebarCollapsed ? "ml-[64px]" : "ml-[280px]")
          )}
        >
          <div className="flex-1 p-4 md:p-6 space-y-6">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
