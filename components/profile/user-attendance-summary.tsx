"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin } from "lucide-react"
import { format, formatDistance } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface AttendanceRecord {
  id: string
  checkInTime: string
  checkOutTime?: string
  checkInLocationName?: string
  checkOutLocationName?: string
  totalHours?: number
  project?: {
    id: string
    title: string
  }
  task?: {
    id: string
    title: string
  }
}

interface AttendanceSummary {
  totalRecords: number
  totalHours: number
  averageHoursPerDay?: number
  firstCheckIn?: string | null
  lastCheckOut?: string | null
  lastCheckIn?: string | null
  activeSessions?: number
}

interface UserAttendanceSummaryProps {
  userId: string
}

export function UserAttendanceSummary({ userId }: UserAttendanceSummaryProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("recent")

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true)
        console.log(`Fetching attendance for user ${userId}`)
        const response = await fetch(`/api/users/${userId}/attendance?limit=5`)

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`)
        }

        const data = await response.json()
        console.log("Attendance data:", data)

        if (data.attendanceRecords) {
          setAttendanceRecords(data.attendanceRecords)
          setSummary(data.summary)
        } else {
          console.warn("No attendance records found in response", data)
          setAttendanceRecords([])
          setSummary({
            totalRecords: 0,
            totalHours: 0,
            averageHoursPerDay: 0
          })
        }
      } catch (error) {
        console.error("Error fetching attendance:", error)
        // Set empty data on error to prevent UI from breaking
        setAttendanceRecords([])
        setSummary({
          totalRecords: 0,
          totalHours: 0,
          averageHoursPerDay: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendance()
  }, [userId])

  // Get the current month name
  const currentMonthName = format(new Date(), "MMMM")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent" onValueChange={setActiveTab}>
          <TabsList className="flex w-full">
            <TabsTrigger value="recent" className="flex-1">Recent Activity</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4 pt-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No attendance records found
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.map(record => (
                  <div key={record.id} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {format(new Date(record.checkInTime), "EEEE, MMMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(record.checkInTime), "h:mm a")} -
                          {record.checkOutTime ? format(new Date(record.checkOutTime), " h:mm a") : " Present"}
                        </div>
                        {record.checkInLocationName && (
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {record.checkInLocationName}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {record.totalHours ? `${record.totalHours.toFixed(1)} hrs` : "Active"}
                        </div>
                        {record.project && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {record.project.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {summary && summary.totalRecords > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="link" asChild>
                      <a href={`/attendance/user/${userId}`}>
                        View all {summary.totalRecords} records
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="pt-4">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : !summary ? (
              <div className="text-center py-4 text-muted-foreground">
                No attendance statistics available
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-md p-4 text-center">
                  <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <div className="text-2xl font-bold">{summary.totalRecords}</div>
                  <div className="text-sm text-muted-foreground">Total Check-ins</div>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <div className="text-2xl font-bold">
                    {summary.lastCheckIn ?
                      format(new Date(summary.lastCheckIn), "MMM d") :
                      "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">Last Check-in</div>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <div className="text-2xl font-bold">
                    {summary.averageHoursPerDay ?
                      summary.averageHoursPerDay.toFixed(1) :
                      "0.0"}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Hours/Day</div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
