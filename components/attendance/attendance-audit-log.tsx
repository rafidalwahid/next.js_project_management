"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Filter, Search, History } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  description: string
  userId: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
  }
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function AttendanceAuditLog() {
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [filters, setFilters] = useState({
    userId: "",
    action: "all",
    startDate: "",
    endDate: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchAuditLogs()
  }, [pagination.page])

  async function fetchAuditLogs() {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.userId) params.append("userId", filters.userId)
      if (filters.action && filters.action !== "all") params.append("action", filters.action)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/attendance/audit-log?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setAuditLogs(data.auditLogs)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch audit logs",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    pagination.page = 1
    fetchAuditLogs()
  }

  function handleFilterChange(key: string, value: string) {
    setFilters({ ...filters, [key]: value })
  }

  function handlePreviousPage() {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 })
    }
  }

  function handleNextPage() {
    if (pagination.page < pagination.totalPages) {
      setPagination({ ...pagination, page: pagination.page + 1 })
    }
  }

  function getActionLabel(action: string) {
    switch (action) {
      case "checked-in":
        return "Checked In"
      case "checked-out":
        return "Checked Out"
      case "attendance-adjusted":
        return "Adjusted Record"
      default:
        return action.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  function getInitials(name: string | null, email: string): string {
    if (name) {
      return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="mr-2 h-5 w-5" />
          Attendance Audit Log
        </CardTitle>
        <CardDescription>
          View a history of all attendance-related activities and adjustments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by description..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              <div>
                <Label htmlFor="startDate" className="sr-only">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="sr-only">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
              <div>
                <Label htmlFor="action" className="sr-only">Action</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => handleFilterChange("action", value)}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="checked-in">Check In</SelectItem>
                    <SelectItem value="checked-out">Check Out</SelectItem>
                    <SelectItem value="attendance-adjusted">Adjustments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchAuditLogs} className="ml-auto">Apply Filters</Button>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.user.image || undefined} alt={log.user.name || log.user.email} />
                            <AvatarFallback>{getInitials(log.user.name, log.user.email)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{log.user.name || log.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionLabel(log.action)}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-md truncate">
                        {log.description}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={pagination.page <= 1 || loading}
                className="flex-1 sm:flex-initial"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="flex-1 sm:flex-initial"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
