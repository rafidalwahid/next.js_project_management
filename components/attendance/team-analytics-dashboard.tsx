"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
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
import { 
  ArrowDown, 
  ArrowUp, 
  Calendar, 
  Clock, 
  Download, 
  Timer, 
  Users,
  FileSpreadsheet 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, subDays, parseISO } from "date-fns"
import { DASHBOARD_DEFAULTS, STATUS_COLORS } from "@/lib/constants/attendance"

// Define interface for component props
interface TeamAnalyticsDashboardProps {
  projectId?: string
}

// Analytics data types for responses from API
interface TeamAttendanceAnalytics {
  totalMembers: number
  activeMembers: number
  totalHours: number
  averageHoursPerDay: number
  attendanceRate: number
  onTimeRate: number
  dailyStats: DailyStat[]
  userStats: UserStat[]
}

interface DailyStat {
  date: string
  presentCount: number
  lateCount: number
  absentCount: number
  averageHours: number
}

interface UserStat {
  userId: string
  userName: string
  userEmail: string
  userImage: string | null
  daysPresent: number
  daysLate: number
  daysAbsent: number
  totalHours: number
  averageHoursPerDay: number
  attendanceRate: number
  onTimeRate: number
}

// Chart colors
const CHART_COLORS = {
  present: "#22c55e", // green
  late: "#f59e0b",    // amber
  absent: "#ef4444",  // red
  hours: "#3b82f6",   // blue
  attendance: "#8b5cf6" // purple
};

export function TeamAnalyticsDashboard({ projectId }: TeamAnalyticsDashboardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<TeamAttendanceAnalytics | null>(null)
  const [timeRange, setTimeRange] = useState("30")
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Construct API URL with parameters
        const params = new URLSearchParams()
        params.append("days", timeRange)
        
        if (projectId) {
          params.append("projectId", projectId)
        }
        
        const url = `/api/attendance/team/analytics?${params.toString()}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status}`)
        }
        
        const data = await response.json()
        setAnalytics(data.analytics)
      } catch (error) {
        console.error("Error fetching team attendance analytics:", error)
        toast({
          title: "Error",
          description: "Failed to load team analytics. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [projectId, timeRange, toast])

  // Format percentage change values
  const formatPercentChange = (value: number) => {
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  }

  // Generate formatted data for the daily attendance chart
  const dailyAttendanceData = useMemo(() => {
    if (!analytics?.dailyStats) return [];
    
    return analytics.dailyStats.map(day => ({
      date: format(parseISO(day.date), "MMM d"),
      Present: day.presentCount,
      Late: day.lateCount,
      Absent: day.absentCount,
      "Average Hours": day.averageHours.toFixed(1)
    }));
  }, [analytics?.dailyStats]);

  // Generate data for the attendance summary pie chart
  const attendanceSummaryData = useMemo(() => {
    if (!analytics) return [];
    
    // Calculate totals from daily stats
    const totalPresent = analytics.dailyStats.reduce((sum, day) => sum + day.presentCount, 0);
    const totalLate = analytics.dailyStats.reduce((sum, day) => sum + day.lateCount, 0);
    const totalAbsent = analytics.dailyStats.reduce((sum, day) => sum + day.absentCount, 0);
    
    return [
      { name: "Present", value: totalPresent, color: CHART_COLORS.present },
      { name: "Late", value: totalLate, color: CHART_COLORS.late },
      { name: "Absent", value: totalAbsent, color: CHART_COLORS.absent }
    ];
  }, [analytics]);

  // Handle exporting analytics data to CSV
  const exportToCSV = () => {
    if (!analytics) return;
    
    // Create user stats CSV
    const userHeaders = "Name,Email,Days Present,Days Late,Days Absent,Total Hours,Average Hours,Attendance Rate,On-Time Rate\n";
    const userRows = analytics.userStats.map(user => 
      `"${user.userName}","${user.userEmail}",${user.daysPresent},${user.daysLate},${user.daysAbsent},${user.totalHours.toFixed(1)},${user.averageHoursPerDay.toFixed(1)},${(user.attendanceRate * 100).toFixed(0)}%,${(user.onTimeRate * 100).toFixed(0)}%`
    ).join("\n");
    
    const userCsv = userHeaders + userRows;
    
    // Create daily stats CSV
    const dailyHeaders = "Date,Present Count,Late Count,Absent Count,Average Hours\n";
    const dailyRows = analytics.dailyStats.map(day => 
      `${day.date},${day.presentCount},${day.lateCount},${day.absentCount},${day.averageHours.toFixed(1)}`
    ).join("\n");
    
    const dailyCsv = dailyHeaders + dailyRows;
    
    // Combine both into a single download
    const projectTitle = projectId ? `Project_${projectId}_` : "";
    const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
    
    // Create and trigger download
    const blob = new Blob([
      "TEAM ATTENDANCE ANALYTICS\n",
      `Report Generated: ${format(new Date(), "MMMM d, yyyy HH:mm")}\n`,
      `Time Range: Last ${timeRange} days\n\n`,
      "TEAM SUMMARY:\n",
      `Total Members: ${analytics.totalMembers}\n`,
      `Active Members: ${analytics.activeMembers}\n`,
      `Total Hours: ${analytics.totalHours.toFixed(1)}\n`,
      `Average Hours Per Day: ${analytics.averageHoursPerDay.toFixed(1)}\n`,
      `Attendance Rate: ${(analytics.attendanceRate * 100).toFixed(0)}%\n`,
      `On-Time Rate: ${(analytics.onTimeRate * 100).toFixed(0)}%\n\n`,
      "USER DETAILS:\n",
      userCsv,
      "\n\nDAILY STATISTICS:\n",
      dailyCsv
    ], { type: "text/csv" });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectTitle}AttendanceAnalytics_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // No data state
  if (!analytics || analytics.totalMembers === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No attendance data available</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {projectId 
                ? "No team members have recorded attendance for this project in the selected time period." 
                : "No attendance records found for the selected time period."}
            </p>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Last {timeRange} days</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with time range selector and export button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Team Attendance Analytics</h2>
          <p className="text-sm text-muted-foreground">
            {projectId 
              ? `Project team attendance statistics for the last ${timeRange} days` 
              : `Company-wide attendance statistics for the last ${timeRange} days`}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Last {timeRange} days</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Export data</span>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">{analytics.activeMembers}</span>
                  <span className="text-xs text-muted-foreground">/ {analytics.totalMembers}</span>
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <div className="text-2xl font-bold">
                  {analytics.totalHours.toFixed(1)}h
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Hours/Day</p>
                <div className="text-2xl font-bold">
                  {analytics.averageHoursPerDay.toFixed(1)}h
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Timer className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">
                    {(analytics.attendanceRate * 100).toFixed(0)}%
                  </span>
                  {analytics.onTimeRate >= 0.9 ? (
                    <ArrowUp className="h-4 w-4 ml-1 text-green-500" />
                  ) : analytics.onTimeRate <= 0.7 ? (
                    <ArrowDown className="h-4 w-4 ml-1 text-red-500" />
                  ) : null}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full flex items-center justify-center">
                <div 
                  className="h-10 w-10 rounded-full border-4" 
                  style={{
                    borderColor: `${CHART_COLORS.attendance}`,
                    background: `conic-gradient(${CHART_COLORS.attendance} ${analytics.attendanceRate * 360}deg, #e5e7eb 0deg)`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
        </TabsList>
        
        {/* Overview tab with charts */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily attendance chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily Attendance</CardTitle>
                <CardDescription>Present, late, and absent counts per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Present" fill={CHART_COLORS.present} />
                      <Bar dataKey="Late" fill={CHART_COLORS.late} />
                      <Bar dataKey="Absent" fill={CHART_COLORS.absent} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Attendance summary pie chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Attendance Summary</CardTitle>
                <CardDescription>Overall attendance distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceSummaryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {attendanceSummaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} records`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Hours trend chart */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily Hours Trend</CardTitle>
                <CardDescription>Average hours worked per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 'dataMax + 2']} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Average Hours" 
                        stroke={CHART_COLORS.hours} 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Team members tab with individual stats */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team Member Attendance</CardTitle>
              <CardDescription>Individual attendance statistics for each team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-2">Employee</th>
                      <th className="text-left font-medium p-2">Present</th>
                      <th className="text-left font-medium p-2">Late</th>
                      <th className="text-left font-medium p-2">Absent</th>
                      <th className="text-left font-medium p-2">Hours</th>
                      <th className="text-left font-medium p-2">Avg/Day</th>
                      <th className="text-left font-medium p-2">Attendance</th>
                      <th className="text-left font-medium p-2">On-Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.userStats.map(user => (
                      <tr key={user.userId} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.userImage || undefined} />
                              <AvatarFallback>
                                {user.userName?.substring(0, 2) || user.userEmail?.substring(0, 2) || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.userName || "Unnamed"}</div>
                              <div className="text-xs text-muted-foreground">{user.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>{user.daysPresent}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            <span>{user.daysLate}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span>{user.daysAbsent}</span>
                          </div>
                        </td>
                        <td className="p-2">{user.totalHours.toFixed(1)}h</td>
                        <td className="p-2">{user.averageHoursPerDay.toFixed(1)}h</td>
                        <td className="p-2">
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-green-500 rounded-full" 
                              style={{ width: `${user.attendanceRate * 100}%` }} 
                            />
                          </div>
                          <div className="text-xs text-right mt-1">
                            {(user.attendanceRate * 100).toFixed(0)}%
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${user.onTimeRate * 100}%` }} 
                            />
                          </div>
                          <div className="text-xs text-right mt-1">
                            {(user.onTimeRate * 100).toFixed(0)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 py-2">
              <div className="flex items-center justify-between w-full">
                <p className="text-sm text-muted-foreground">
                  {analytics.userStats.length} team members
                </p>
                <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export to CSV
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Daily breakdown tab */}
        <TabsContent value="daily">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Attendance Breakdown</CardTitle>
              <CardDescription>Detailed attendance statistics for each day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analytics.dailyStats.slice().reverse().map((day, index) => (
                  <Card key={day.date} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {format(parseISO(day.date), "EEEE, MMMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {day.averageHours.toFixed(1)} avg hours
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 rounded-md bg-green-50">
                          <div className="text-green-600 font-medium">{day.presentCount}</div>
                          <div className="text-xs text-muted-foreground">Present</div>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-md bg-amber-50">
                          <div className="text-amber-600 font-medium">{day.lateCount}</div>
                          <div className="text-xs text-muted-foreground">Late</div>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-md bg-red-50">
                          <div className="text-red-600 font-medium">{day.absentCount}</div>
                          <div className="text-xs text-muted-foreground">Absent</div>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Attendance Distribution</div>
                        <div className="flex h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${day.presentCount / (day.presentCount + day.lateCount + day.absentCount) * 100}%` }}
                          />
                          <div 
                            className="bg-amber-500" 
                            style={{ width: `${day.lateCount / (day.presentCount + day.lateCount + day.absentCount) * 100}%` }}
                          />
                          <div 
                            className="bg-red-500" 
                            style={{ width: `${day.absentCount / (day.presentCount + day.lateCount + day.absentCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
