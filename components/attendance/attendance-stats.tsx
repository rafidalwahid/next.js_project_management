"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

export function AttendanceStats() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [period, setPeriod] = useState("month")

  useEffect(() => {
    fetchAttendanceStats()
  }, [period])

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/attendance/stats?period=${period}`)
      const data = await response.json()
      
      if (response.ok) {
        setStats(data.stats)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load attendance statistics",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error fetching attendance stats:", err)
      toast({
        title: "Error",
        description: "Failed to load attendance statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="month" onValueChange={handlePeriodChange}>
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `${stats?.totalHours || 0}h`}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === "day" ? "Today" : 
               period === "week" ? "This week" : 
               period === "month" ? "This month" : "This year"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `${stats?.averageHours || 0}h`}
            </div>
            <p className="text-xs text-muted-foreground">Per working day</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `${stats?.onTimeRate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">Check-ins before 9 AM</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${stats?.attendanceDays || 0}/${stats?.totalWorkingDays || 0}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.attendanceRate || 0}% attendance rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
