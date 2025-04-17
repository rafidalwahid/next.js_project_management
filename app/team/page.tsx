"use client"

import { useState, useEffect } from "react"
import { Filter, Plus, Search, LayoutGrid, List } from "lucide-react"
import { useUsers } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserGrid } from "@/components/team/user-grid"
import { UserList } from "@/components/team/user-list"
import { Pagination } from "@/components/team/pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const { users: allUsers, isLoading, isError, mutate } = useUsers(searchQuery, 100) // Increased limit

  // Filter users by role
  const filteredUsers = allUsers.filter(user => {
    if (roleFilter === "all") return true
    return user.role.toLowerCase() === roleFilter.toLowerCase()
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const users = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const { toast } = useToast()
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // This would be implemented with the API in a real app
  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      toast({
        title: "Not implemented",
        description: "User deletion is not implemented in this demo.",
        variant: "destructive",
      })
    }
  }

  // Show loading state when checking auth or loading data
  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-destructive">Error loading users. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-background sticky top-0 z-10 py-2">
        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
        <div className="flex items-center gap-2">
          <Button className="bg-black hover:bg-black/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add New Member
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-2">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-3xl">{allUsers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Active team members in your organization</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl">{allUsers.filter(u => u.role.toLowerCase() === 'admin').length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Users with administrative privileges</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Managers</CardDescription>
            <CardTitle className="text-3xl">{allUsers.filter(u => u.role.toLowerCase() === 'manager').length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Project and team managers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Contributors</CardDescription>
            <CardTitle className="text-3xl">{allUsers.filter(u => u.role.toLowerCase() === 'contributor').length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Team members contributing to projects</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-0">
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Directory</CardTitle>
              <CardDescription>
                View and manage all team members in your organization.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'member' : 'members'}
              {roleFilter !== 'all' && ` with role: ${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}`}
              {searchQuery && ` matching: "${searchQuery}"`}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-muted/30 p-4 rounded-lg">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8 bg-background"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="contributor">Contributor</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>

            <Tabs defaultValue={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2 md:w-[160px] bg-background/80">
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-6">
            {viewMode === "grid" ? (
              <UserGrid users={users} onDelete={handleDelete} />
            ) : (
              <UserList users={users} onDelete={handleDelete} />
            )}

            {filteredUsers.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
