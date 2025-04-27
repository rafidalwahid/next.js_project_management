"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
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
  Line
} from "recharts"
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  BarChart3,
  ListFilter
} from "lucide-react"

interface TeamAnalyticsProps {
  projectId?: string
}

interface UserStat {
  userId: string
  name: string
  email: string
  image: string | null
  totalHours: number
  attendanceDays: number
  averageHoursPerDay: number
  attendanceRate: number
  onTimeCount: number
  onTimeRate: number
}

interface DailyStat {
  date: string
  totalHours: number
  attendanceCount: number
  onTimeCount: number
}

interface TeamAnalytics {
  totalMembers: number
  activeMembers: number
  totalHours: number
  averageHoursPerDay: number
  attendanceRate: number
  onTimeRate: number
  dailyStats: DailyStat[]
  userStats: UserStat[]
}

export function TeamAnalyticsDashboard({ projectId }: TeamAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null)
  const [timeRange, setTimeRange] = useState("30")
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [projectId, timeRange])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        days: timeRange,
      })
      
      if (projectId) {
        params.append("projectId", projectId)
      }
      
      const response = await fetch(`/api/attendance/team/analytics?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setAnalytics(data.analytics)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch team analytics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching team analytics:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function getInitials(name: string, email: string): string {
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

  function formatDate(dateStr: string): string {
    try {
      return format(new Date(dateStr), "MMM d")
    } catch (error) {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Team Attendance Analytics
        </h2>
        
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {analytics?.activeMembers || 0}/{analytics?.totalMembers || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active members / Total members
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Hours
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {analytics?.totalHours || 0}h
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last {timeRange} days
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Attendance Rate
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {analytics?.attendanceRate || 0}%
                    </div>
                    <Progress 
                      value={analytics?.attendanceRate || 0} 
                      className="h-2 mt-2"
                    />
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  On-Time Rate
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {analytics?.onTimeRate || 0}%
                    </div>
                    <Progress 
                      value={analytics?.onTimeRate || 0} 
                      className="h-2 mt-2"
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance</CardTitle>
              <CardDescription>
                Attendance hours and check-ins over the last {timeRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.dailyStats.map(stat => ({
                        ...stat,
                        date: formatDate(stat.date),
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalHours" name="Total Hours" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="attendanceCount" name="Check-ins" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Team members with the highest attendance hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : analytics?.userStats && analytics.userStats.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.userStats
                      .sort((a, b) => b.totalHours - a.totalHours)
                      .slice(0, 5)
                      .map((user) => (
                        <div key={user.userId} className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.totalHours}h total ({user.averageHoursPerDay}h/day)
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            {user.attendanceRate}%
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Attendance Concerns</CardTitle>
                <CardDescription>
                  Team members with low attendance rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : analytics?.userStats && analytics.userStats.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.userStats
                      .filter(user => user.attendanceRate < 70) // Filter users with less than 70% attendance
                      .sort((a, b) => a.attendanceRate - b.attendanceRate)
                      .slice(0, 5)
                      .map((user) => (
                        <div key={user.userId} className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.attendanceDays} days present (out of {parseInt(timeRange) > 22 ? 22 : parseInt(timeRange)})
                            </p>
                          </div>
                          <div className="text-sm font-medium text-red-500">
                            {user.attendanceRate}%
                          </div>
                        </div>
                      ))}
                    
                    {analytics.userStats.filter(user => user.attendanceRate < 70).length === 0 && (
                      <div className="py-8 text-center text-green-600">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                        No attendance concerns!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Member Performance</CardTitle>
              <CardDescription>
                Detailed attendance statistics for each team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : analytics?.userStats && analytics.userStats.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Member</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                        <TableHead className="text-right">Avg Hours/Day</TableHead>
                        <TableHead className="text-right">Days Present</TableHead>
                        <TableHead className="text-right">Attendance Rate</TableHead>
                        <TableHead className="text-right">On-Time Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.userStats.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                                <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{user.name || user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{user.totalHours}h</TableCell>
                          <TableCell className="text-right">{user.averageHoursPerDay}h</TableCell>
                          <TableCell className="text-right">{user.attendanceDays}</TableCell>
                          <TableCell className="text-right">
                            <span className={user.attendanceRate < 70 ? "text-red-500 font-medium" : ""}>
                              {user.attendanceRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={user.onTimeRate < 70 ? "text-amber-500 font-medium" : ""}>
                              {user.onTimeRate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No team member data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>
                Attendance patterns over the last {timeRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics.dailyStats.map(stat => ({
                        ...stat,
                        date: formatDate(stat.date),
                        onTimeRate: stat.attendanceCount > 0 
                          ? (stat.onTimeCount / stat.attendanceCount) * 100 
                          : 0
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="attendanceCount" 
                        name="Check-ins" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="onTimeRate" 
                        name="On-Time Rate (%)" 
                        stroke="#82ca9d" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
