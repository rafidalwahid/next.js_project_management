"use client"

import { useState, useEffect } from "react"
import { format, parseISO, differenceInDays } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Edit,
  Download
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { AttendanceAdjustmentDialog } from "./attendance-adjustment-dialog"

interface EmployeeAttendanceProfileProps {
  userId: string
}

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  department?: string | null
  position?: string | null
  phone?: string | null
  location?: string | null
}

interface AttendanceRecord {
  id: string
  userId: string
  checkInTime: string
  checkOutTime: string | null
  checkInLocationName: string | null
  checkOutLocationName: string | null
  totalHours: number | null
  notes: string | null
  project?: {
    id: string
    title: string
  } | null
  task?: {
    id: string
    title: string
  } | null
}

interface AttendanceSummary {
  totalRecords: number
  totalHours: number
  averageHoursPerDay: number
  firstCheckIn: string | null
  lastCheckOut: string | null
  attendanceRate?: number
  onTimeRate?: number
  lateArrivals?: number
  earlyDepartures?: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function EmployeeAttendanceProfile({ userId }: EmployeeAttendanceProfileProps) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(1)), "yyyy-MM-dd"), // First day of current month
    endDate: format(new Date(), "yyyy-MM-dd"), // Today
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchUserData()
    fetchAttendanceData()
  }, [userId, pagination.page, dateRange])

  async function fetchUserData() {
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch user data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  async function fetchAttendanceData() {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      
      const response = await fetch(`/api/users/${userId}/attendance?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setAttendanceRecords(data.attendanceRecords)
        setSummary(data.summary)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch attendance data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  function handleDateRangeChange(key: string, value: string) {
    setDateRange({ ...dateRange, [key]: value })
    setPagination({ ...pagination, page: 1 }) // Reset to first page when changing date range
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

  function calculateDuration(checkInTime: string, checkOutTime: string | null): string {
    if (!checkOutTime) return "In progress"
    
    try {
      const start = new Date(checkInTime)
      const end = new Date(checkOutTime)
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid time"
      }
      
      const diffMs = end.getTime() - start.getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      
      return `${hours}h ${minutes}m`
    } catch (error) {
      console.error("Error calculating duration:", error)
      return "Error"
    }
  }

  function exportAttendanceData() {
    if (!attendanceRecords.length) return
    
    // Create CSV content
    const headers = ["Date", "Check In", "Check Out", "Duration", "Location", "Project", "Notes"]
    const rows = attendanceRecords.map(record => [
      format(new Date(record.checkInTime), "yyyy-MM-dd"),
      format(new Date(record.checkInTime), "HH:mm:ss"),
      record.checkOutTime ? format(new Date(record.checkOutTime), "HH:mm:ss") : "N/A",
      record.totalHours ? `${record.totalHours} hours` : "N/A",
      record.checkInLocationName || "N/A",
      record.project?.title || "N/A",
      record.notes || ""
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_${user?.name || userId}_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate attendance metrics
  const totalDays = dateRange.startDate && dateRange.endDate
    ? differenceInDays(new Date(dateRange.endDate), new Date(dateRange.startDate)) + 1
    : 30
  
  const workingDays = Math.min(totalDays, Math.round(totalDays * 5/7)) // Approximate working days (excluding weekends)
  const attendanceRate = summary?.totalRecords && workingDays
    ? Math.min(100, (summary.totalRecords / workingDays) * 100)
    : 0
  
  // Prepare chart data
  const attendanceByDay = attendanceRecords.reduce((acc: Record<string, number>, record) => {
    const day = format(new Date(record.checkInTime), "yyyy-MM-dd")
    acc[day] = (acc[day] || 0) + (record.totalHours || 0)
    return acc
  }, {})
  
  const chartData = Object.entries(attendanceByDay).map(([date, hours]) => ({
    date: format(new Date(date), "MMM d"),
    hours
  })).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.image || undefined} alt={user?.name || user?.email || ""} />
                <AvatarFallback className="text-2xl">
                  {user ? getInitials(user.name || "", user.email) : "..."}
                </AvatarFallback>
              </Avatar>
              <Badge variant={user?.role === "admin" ? "destructive" : user?.role === "manager" ? "default" : "secondary"}>
                {user?.role || "Loading..."}
              </Badge>
            </div>
            
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-48" /> : user?.name || user?.email || "Unknown User"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {loading ? <Skeleton className="h-4 w-40" /> : user?.email || "No email"}
                </div>
                
                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {loading ? <Skeleton className="h-4 w-32" /> : user.phone}
                  </div>
                )}
                
                {user?.department && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {loading ? <Skeleton className="h-4 w-36" /> : user.department}
                  </div>
                )}
                
                {user?.position && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {loading ? <Skeleton className="h-4 w-36" /> : user.position}
                  </div>
                )}
                
                {user?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {loading ? <Skeleton className="h-4 w-36" /> : user.location}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Total Hours</span>
                <span className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16" /> : `${summary?.totalHours?.toFixed(1) || 0}h`}
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Attendance Rate</span>
                <div className="flex items-center gap-2">
                  <Progress value={attendanceRate} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{attendanceRate.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h3 className="text-xl font-bold">Attendance Records</h3>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="whitespace-nowrap">From:</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
              className="w-auto"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate" className="whitespace-nowrap">To:</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
              className="w-auto"
            />
          </div>
          
          <Button onClick={fetchAttendanceData} variant="outline">
            Apply
          </Button>
          
          <Button onClick={exportAttendanceData} variant="outline" disabled={!attendanceRecords.length}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="records">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="records" className="space-y-4">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden md:table-cell">Project</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No attendance records found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.checkInTime), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.checkInTime), "h:mm a")}
                      </TableCell>
                      <TableCell>
                        {record.checkOutTime
                          ? format(new Date(record.checkOutTime), "h:mm a")
                          : "In progress"}
                      </TableCell>
                      <TableCell>
                        {record.totalHours
                          ? `${record.totalHours.toFixed(1)}h`
                          : calculateDuration(record.checkInTime, record.checkOutTime)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {record.checkInLocationName || "Unknown location"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {record.project?.title || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <AttendanceAdjustmentDialog
                          record={record}
                          onAdjusted={fetchAttendanceData}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
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
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="summary">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16" /> : `${summary?.totalHours?.toFixed(1) || 0}h`}
                </div>
                <p className="text-xs text-muted-foreground">
                  For the selected period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16" /> : `${summary?.averageHoursPerDay?.toFixed(1) || 0}h`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Hours per working day
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16" /> : `${attendanceRate.toFixed(0)}%`}
                </div>
                <Progress value={attendanceRate} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Days Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    `${summary?.totalRecords || 0}/${workingDays}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Working days in period
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">First & Last Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-4 border-l-4 border-green-500 pl-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">First Check-in</p>
                          {summary?.firstCheckIn ? (
                            <>
                              <p className="text-sm">{format(new Date(summary.firstCheckIn), "EEEE, MMMM d, yyyy")}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(summary.firstCheckIn), "h:mm a")}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No check-in records</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4 border-l-4 border-blue-500 pl-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Last Check-out</p>
                          {summary?.lastCheckOut ? (
                            <>
                              <p className="text-sm">{format(new Date(summary.lastCheckOut), "EEEE, MMMM d, yyyy")}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(summary.lastCheckOut), "h:mm a")}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No check-out records</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Projects Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="h-[200px]">
                    {attendanceRecords.some(r => r.project) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(
                              attendanceRecords.reduce((acc: Record<string, number>, record) => {
                                const projectName = record.project?.title || "No Project";
                                acc[projectName] = (acc[projectName] || 0) + (record.totalHours || 0);
                                return acc;
                              }, {})
                            ).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {Object.entries(
                              attendanceRecords.reduce((acc: Record<string, number>, record) => {
                                const projectName = record.project?.title || "No Project";
                                acc[projectName] = (acc[projectName] || 0) + (record.totalHours || 0);
                                return acc;
                              }, {})
                            ).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value.toFixed(1)}h`, "Hours"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No project data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="charts">
          <Card>
            <CardHeader>
              <CardTitle>Hours by Day</CardTitle>
              <CardDescription>
                Daily work hours for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}h`, "Hours"]} />
                      <Legend />
                      <Bar dataKey="hours" name="Work Hours" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
