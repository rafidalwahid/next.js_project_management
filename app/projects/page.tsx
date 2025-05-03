"use client"

import Link from "next/link"
import { Filter, Plus, Search, Edit, Trash, MoreHorizontal, Eye, ChevronLeft, ChevronRight, ArrowUpDown, Users, Check, X } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useProjects } from "@/hooks/use-data"
import { projectApi } from "@/lib/api"
import { teamApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/tasks/pagination"

interface Project {
  id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  statuses?: {
    id: string;
    name: string;
    color: string;
    description?: string | null;
    isDefault: boolean;
  }[];
  teamMembers?: {
    id: string;
    userId: string;
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
    };
  }[];
}

export default function ProjectsPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" })
  const [sortField, setSortField] = useState<string>("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [teamMemberFilter, setTeamMemberFilter] = useState<string[]>([])
  const [teamMemberOpen, setTeamMemberOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false)
  const isMobile = useIsMobile()

  // Apply filters when search or date filters change
  const activeFilters = {
    ...(searchTerm ? { title: searchTerm } : {}),
    ...(dateFilter.startDate ? { startDate: dateFilter.startDate } : {}),
    ...(dateFilter.endDate ? { endDate: dateFilter.endDate } : {}),
    ...(teamMemberFilter.length > 0 ? { teamMemberIds: teamMemberFilter.join(',') } : {}),
    ...(sortField ? { sortField } : {}),
    ...(sortDirection ? { sortDirection } : {}),
    ...filters
  }

  const { projects, isLoading, isError, mutate, pagination } = useProjects(page, 10, activeFilters)
  const { toast } = useToast()

  // Fetch team members for filtering
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setIsLoadingTeamMembers(true)
      try {
        const response = await teamApi.getTeamMembers(undefined, 1, 100)
        // Create a unique list of users from team memberships
        const uniqueUsers = Array.from(
          new Map(
            response.teamMembers.map((member: any) => [
              member.user.id,
              {
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                image: member.user.image
              }
            ])
          ).values()
        )
        setTeamMembers(uniqueUsers)
      } catch (error) {
        console.error("Error fetching team members:", error)
      } finally {
        setIsLoadingTeamMembers(false)
      }
    }

    fetchTeamMembers()
  }, [])

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle team member filter toggle
  const toggleTeamMember = (userId: string) => {
    setTeamMemberFilter(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when changing pages
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show error toast when there's an API error
  useEffect(() => {
    if (isError) {
      console.error('Projects page error:', isError);
      toast({
        title: "Error loading projects",
        description: isError instanceof Error ? isError.message : "Failed to load projects",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  // Handle search input with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Apply date filters
  const applyDateFilters = () => {
    mutate();
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setDateFilter({ startDate: "", endDate: "" });
    setFilters({});
    setSearchTerm("");
    setTeamMemberFilter([]);
    setSortField("updatedAt");
    setSortDirection("desc");
    mutate();
  };

  const deleteProject = async (id: string) => {
    try {
      await projectApi.deleteProject(id)
      mutate() // Refresh the data
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the project",
        variant: "destructive",
      })
    }
  };

  // Function to get user initials for avatar fallback
  const getUserInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <div className="flex items-center gap-2">
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <span className={isMobile ? "sr-only" : ""}>New Project</span>
              {isMobile && <span className="sr-only">Create Project</span>}
            </Button>
          </Link>
        </div>
      </div>

      <div className={cn(
        "flex gap-2 mt-4",
        isMobile ? "flex-col" : "flex-row items-center"
      )}>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className={cn(
          "flex gap-2",
          isMobile ? "w-full mt-2" : ""
        )}>
          <Popover open={teamMemberOpen} onOpenChange={setTeamMemberOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9",
                  isMobile ? "flex-1" : "",
                  teamMemberFilter.length > 0 && "bg-primary/10 text-primary"
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                {teamMemberFilter.length > 0
                  ? `${teamMemberFilter.length} Member${teamMemberFilter.length > 1 ? 's' : ''}`
                  : "Team Members"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search members..." />
                <CommandList>
                  <CommandEmpty>No members found</CommandEmpty>
                  <CommandGroup>
                    {isLoadingTeamMembers ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      teamMembers.map((member) => (
                        <CommandItem
                          key={member.id}
                          onSelect={() => toggleTeamMember(member.id)}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Checkbox
                              checked={teamMemberFilter.includes(member.id)}
                              onCheckedChange={() => toggleTeamMember(member.id)}
                            />
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-black">
                                {member.image ? (
                                  <AvatarImage src={member.image} alt={member.name || ""} />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getUserInitials(member.name)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="text-sm">{member.name || member.email}</span>
                            </div>
                          </div>
                          {teamMemberFilter.includes(member.id) && (
                            <Check className="h-4 w-4" />
                          )}
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                  {teamMemberFilter.length > 0 && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-xs"
                        onClick={() => setTeamMemberFilter([])}
                      >
                        Clear selection
                      </Button>
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            className={cn("h-9", isMobile && "flex-1")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Date Filter
          </Button>

          {(Object.keys(activeFilters).length > 2 || teamMemberFilter.length > 0 || dateFilter.startDate || dateFilter.endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-9", isMobile && "flex-1")}
              onClick={resetFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-muted/40 rounded-md p-4 mt-2 space-y-4">
          <h3 className="font-medium">Filter Projects by Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={applyDateFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-4 mt-4">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
        </div>
      ) : isError ? (
        <div className="text-center p-4 mt-4 text-red-500 border border-red-200 rounded-md bg-red-50/50">
          <p className="font-semibold">Error loading projects</p>
          <p className="text-sm mt-2">{isError instanceof Error ? isError.message : "An unexpected error occurred"}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => mutate()}
          >
            Try Again
          </Button>
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="rounded-md border shadow-sm overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("title")}
                    className={cn(
                      "flex items-center gap-1 font-medium -ml-3 px-3",
                      sortField === "title" && "text-primary"
                    )}
                  >
                    Name
                    <ArrowUpDown className={cn(
                      "h-4 w-4",
                      sortField === "title" && "text-primary"
                    )} />
                    {sortField === "title" && (
                      <span className="sr-only">
                        {sortDirection === "asc" ? "sorted ascending" : "sorted descending"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead className={isMobile ? "hidden md:table-cell" : ""}>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("startDate")}
                    className={cn(
                      "flex items-center gap-1 font-medium -ml-3 px-3",
                      sortField === "startDate" && "text-primary"
                    )}
                  >
                    Start Date
                    <ArrowUpDown className={cn(
                      "h-4 w-4",
                      sortField === "startDate" && "text-primary"
                    )} />
                    {sortField === "startDate" && (
                      <span className="sr-only">
                        {sortDirection === "asc" ? "sorted ascending" : "sorted descending"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead className={isMobile ? "hidden md:table-cell" : ""}>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("endDate")}
                    className={cn(
                      "flex items-center gap-1 font-medium -ml-3 px-3",
                      sortField === "endDate" && "text-primary"
                    )}
                  >
                    End Date
                    <ArrowUpDown className={cn(
                      "h-4 w-4",
                      sortField === "endDate" && "text-primary"
                    )} />
                    {sortField === "endDate" && (
                      <span className="sr-only">
                        {sortDirection === "asc" ? "sorted ascending" : "sorted descending"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project: Project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{project.title}</div>
                      {isMobile && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No start date'}
                          {project.endDate ? ` - ${new Date(project.endDate).toLocaleDateString()}` : ''}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={isMobile ? "hidden md:table-cell" : ""}>
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                  </TableCell>
                  <TableCell className={isMobile ? "hidden md:table-cell" : ""}>
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2 overflow-hidden">
                      {project.teamMembers && project.teamMembers.length > 0 ? (
                        <>
                          {project.teamMembers.slice(0, isMobile ? 2 : 3).map((member) => (
                            <Avatar key={member.id} className="h-8 w-8 border border-black">
                              {member.user.image ? (
                                <AvatarImage src={member.user.image} alt={member.user.name || ""} />
                              ) : (
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getUserInitials(member.user.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          ))}
                          {project.teamMembers.length > (isMobile ? 2 : 3) && (
                            <div className="flex items-center justify-center h-8 w-8 rounded-full border border-black bg-muted text-xs font-medium">
                              +{project.teamMembers.length - (isMobile ? 2 : 3)}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">No members</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`} className="cursor-pointer flex items-center">
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`} className="cursor-pointer flex items-center">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteProject(project.id)}
                          className="text-destructive focus:text-destructive cursor-pointer flex items-center"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 && (
            <div className={cn("mt-4", isMobile ? "px-4" : "px-6")}>
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-6 mt-4 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">No projects found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            asChild
          >
            <Link href="/projects/new">Create your first project</Link>
          </Button>
        </div>
      )}
    </DashboardLayout>
  )
}

