'use client';

import { DashboardNav } from '@/components/dashboard-nav';
import { UserNav } from '@/components/user-nav';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelLeftClose, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { TopCornerAttendance } from '@/components/attendance/top-corner-attendance';

interface ClientSideLayoutProps {
  children: React.ReactNode;
}

// Define sidebar width constants for consistency
const SIDEBAR_WIDTHS = {
  collapsed: {
    default: '3rem', // 48px
    lg: '4rem', // 64px
  },
  expanded: {
    default: '14rem', // 224px
    lg: '15rem', // 240px
    xl: '16rem', // 256px
  },
  mobile: '18rem', // 288px
};

export default function ClientSideLayout({ children }: ClientSideLayoutProps) {
  // State for sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get breakpoint information
  const { isMobile, isXs, isLg, isXl, is2xl } = useBreakpoints();

  // Load sidebar state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
  }, []);

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    try {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full md:hidden border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="flex h-12 xs:h-14 items-center justify-between px-2 xs:px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <span className="font-semibold truncate">
              <span className="xs:hidden">PM</span>
              <span className="hidden xs:inline sm:hidden">Project Mgmt</span>
              <span className="hidden sm:inline">Project Management</span>
            </span>
          </div>
          <div className="shrink-0">
            <TopCornerAttendance />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-full max-w-[18rem] xs:max-w-[20rem] sm:max-w-[22rem]"
          >
            <div className="flex flex-col h-full">
              <div className="flex h-14 items-center justify-between border-b border-border px-4 bg-primary text-primary-foreground">
                <SheetTitle className="font-bold text-base text-primary-foreground truncate">
                  <span className="xs:hidden">PM</span>
                  <span className="hidden xs:inline sm:hidden">Project Mgmt</span>
                  <span className="hidden sm:inline">Project Management</span>
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className="size-8 text-primary-foreground hover:bg-primary-foreground/10 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <PanelLeftClose className="size-4" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-2 p-3">
                  <DashboardNav collapsed={false} />
                </div>
              </div>

              <div className="border-t border-border bg-muted/50 p-3">
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
          tabIndex={0}
          aria-label="Main navigation"
          className={cn(
            'fixed left-0 top-0 bottom-0 z-30 hidden md:flex flex-col h-screen transition-all duration-300 ease-in-out bg-background border-r border-border',
            sidebarCollapsed
              ? 'w-[3rem] lg:w-[4rem]'
              : 'w-[14rem] lg:w-[15rem] xl:w-[16rem]'
          )}
          style={{
            // Use CSS variables for consistent sidebar widths
            '--sidebar-width-collapsed': SIDEBAR_WIDTHS.collapsed.default,
            '--sidebar-width-collapsed-lg': SIDEBAR_WIDTHS.collapsed.lg,
            '--sidebar-width-expanded': SIDEBAR_WIDTHS.expanded.default,
            '--sidebar-width-expanded-lg': SIDEBAR_WIDTHS.expanded.lg,
            '--sidebar-width-expanded-xl': SIDEBAR_WIDTHS.expanded.xl,
          } as React.CSSProperties}
        >
          <div className="flex h-14 items-center border-b border-border px-4 bg-primary text-primary-foreground">
            <div
              className={cn(
                'flex w-full items-center',
                sidebarCollapsed ? 'justify-center' : 'justify-between'
              )}
            >
              {!sidebarCollapsed && (
                <span className="font-bold text-base truncate">
                  <span className="hidden sm:inline">Project Management</span>
                  <span className="sm:hidden">PM</span>
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="size-8 text-primary-foreground hover:bg-primary-foreground/10 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
                <span className="sr-only">
                  {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className={cn('flex flex-col gap-2', sidebarCollapsed ? 'px-2 py-3' : 'p-3')}>
              <DashboardNav collapsed={sidebarCollapsed} />
            </div>
          </div>

          <div
            className={cn('border-t border-border bg-muted/50', sidebarCollapsed ? 'p-2' : 'p-3')}
          >
            <UserNav
              compact={sidebarCollapsed}
              showName={!sidebarCollapsed}
              className={cn(
                'w-full hover:bg-accent hover:text-accent-foreground rounded-md transition-colors',
                sidebarCollapsed ? 'p-2' : 'p-3'
              )}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out',
            isMobile ? 'w-full mt-12 xs:mt-14' : '',
            !isMobile &&
              (sidebarCollapsed
                ? 'ml-[3rem] lg:ml-[4rem]'
                : 'ml-[14rem] lg:ml-[15rem] xl:ml-[16rem]'),
            'max-w-[1920px] 2xl:mx-auto' // Center content on very large screens
          )}
        >
          <div className="flex-1 p-3 xs:p-4 md:p-5 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4 xs:mb-6">
              <div className="grow min-w-0">
                <Breadcrumbs />
              </div>
              <div className="hidden md:block shrink-0">
                <TopCornerAttendance />
              </div>
            </div>
            <div className="space-y-4 xs:space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
