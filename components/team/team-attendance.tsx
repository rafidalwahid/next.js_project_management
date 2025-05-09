"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Filter, Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/ui/role-badge"
import { AttendanceWithRelations, AttendanceSummary } from "@/types/attendance"

interface TeamAttendanceProps {
  projectId: string
}

export function TeamAttendance({ projectId }: TeamAttendanceProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithRelations[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [groupBy, setGroupBy] = useState("user")
  const [timeRange, setTimeRange] = useState("all")

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true)

        // Build query parameters
        const params = new URLSearchParams();
        params.append('projectId', projectId);

        if (timeRange === "today") {
          const today = new Date().toISOString().split('T')[0];
          params.append('startDate', today);
        } else if (timeRange === "week") {
          const today = new Date();
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          params.append('startDate', weekAgo.toISOString().split('T')[0]);
        } else if (timeRange === "month") {
          const today = new Date();
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          params.append('startDate', monthAgo.toISOString().split('T')[0]);
        }

        // Fetch attendance records from the admin API
        const response = await fetch(`/api/attendance/admin/records?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch team attendance');
        }

        const data = await response.json();
        setAttendanceRecords(data.attendanceRecords);

        // Create summary from the response data
        const summary: AttendanceSummary = {
          totalRecords: data.summary.totalRecords,
          totalHours: data.summary.totalHours,
          userCount: data.summary.uniqueUsers
        };

        setSummary(summary);
      } catch (error) {
        console.error("Error fetching team attendance:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendance()
  }, [projectId, timeRange])

  // Filter records based on search
  const filteredRecords = attendanceRecords.filter(record => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const nameMatch = record.user.name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = record.user.email.toLowerCase().includes(searchLower);
    const locationMatch = record.checkInLocationName?.toLowerCase().includes(searchLower) || false;

    return nameMatch || emailMatch || locationMatch;
  });

  // Group records based on selection
  const groupedRecords = filteredRecords.reduce((groups, record) => {
    let key;

    if (groupBy === "user") {
      key = record.user?.id || 'unknown';
    } else if (groupBy === "date") {
      key = format(new Date(record.checkInTime), "yyyy-MM-dd");
    } else if (groupBy === "location") {
      key = record.checkInLocationName || "Unknown";
    }

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(record);
    return groups;
  }, {} as Record<string, AttendanceWithRelations[]>);

  // Get user names for user grouping
  const getUserName = (userId: string) => {
    const record = attendanceRecords.find(r => r.user.id === userId);
    return record?.user.name || record?.user.email || "Unknown User";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Team Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, or location..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Group by User</SelectItem>
                <SelectItem value="date">Group by Date</SelectItem>
                <SelectItem value="location">Group by Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {summary && (
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-md p-3 text-center">
                <div className="text-2xl font-bold">{summary.userCount}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div className="border rounded-md p-3 text-center">
                <div className="text-2xl font-bold">{summary.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Total Check-ins</div>
              </div>
              <div className="border rounded-md p-3 text-center">
                <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records found
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRecords).map(([key, records]) => (
              <div key={key} className="border rounded-md p-4">
                <div className="font-medium text-lg mb-3 flex items-center">
                  {groupBy === "user" && (
                    <>
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={records[0].user.image || undefined} />
                        <AvatarFallback>
                          {(records[0].user.name || records[0].user.email).substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {getUserName(key)}
                      <RoleBadge role={records[0].user.role} className="ml-2" />
                    </>
                  )}
                  {groupBy === "date" && (
                    <>
                      <Calendar className="mr-2 h-5 w-5" />
                      {format(new Date(records[0].checkInTime), "EEEE, MMMM d, yyyy")}
                    </>
                  )}
                  {groupBy === "location" && (
                    <>
                      <Clock className="mr-2 h-5 w-5" />
                      {key}
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  {records.map(record => (
                    <div key={record.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div>
                        {groupBy !== "user" && (
                          <div className="font-medium">{record.user.name || record.user.email}</div>
                        )}
                        {groupBy !== "date" && (
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(record.checkInTime), "EEEE, MMMM d, yyyy")}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(record.checkInTime), "h:mm a")} -
                          {record.checkOutTime ? format(new Date(record.checkOutTime), " h:mm a") : " Present"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {record.totalHours ? `${record.totalHours.toFixed(1)} hrs` : "Active"}
                        </div>
                        {groupBy !== "location" && record.checkInLocationName && (
                          <div className="text-sm text-muted-foreground">
                            {record.checkInLocationName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
