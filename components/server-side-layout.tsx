'use client';

import { DashboardNav } from '@/components/dashboard-nav';
import { UserNav } from '@/components/user-nav';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopCornerAttendance } from '@/components/attendance/top-corner-attendance';

interface ServerSideLayoutProps {
  children: React.ReactNode;
}

export default function ServerSideLayout({ children }: ServerSideLayoutProps) {
  return (
    <>
      {/* Desktop Sidebar - Server-side rendering */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-30 hidden md:flex flex-col h-screen transition-all duration-300 ease-in-out bg-background border-r border-border w-[240px]"
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center border-b border-border px-4 bg-primary text-primary-foreground">
          <div className="flex w-full items-center justify-between">
            <span className="font-bold text-base truncate">
              <span className="hidden sm:inline">Project Management</span>
              <span className="sm:hidden">PM</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-primary-foreground hover:bg-primary-foreground/10 rounded-md"
            >
              <PanelLeftClose className="size-4" />
              <span className="sr-only">Collapse sidebar</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 p-3">
            <DashboardNav collapsed={false} />
          </div>
        </div>

        <div className="border-t border-border bg-muted/50 p-3">
          <UserNav
            compact={false}
            showName={true}
            className="w-full hover:bg-accent hover:text-accent-foreground rounded-md transition-colors p-3"
          />
        </div>
      </aside>

      {/* Main Content - Server-side rendering */}
      <main className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ml-[240px]">
        <div className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="grow min-w-0">
              <Breadcrumbs />
            </div>
            <div className="hidden md:block shrink-0">
              <TopCornerAttendance />
            </div>
          </div>
          {children}
        </div>
      </main>
    </>
  );
}
