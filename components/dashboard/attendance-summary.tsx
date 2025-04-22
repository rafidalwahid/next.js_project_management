"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { format, startOfWeek, endOfWeek, formatDistanceToNow } from "date-fns"

interface AttendanceSummaryProps {
  period: "today" | "week" | "month"
  title: string
  subtitle?: string
}

interface AttendanceData {
  daysWorked: number
  totalHours: number
  avgHoursPerDay: number
  attendanceRate?: number
  currentStatus?: "checked-in" | "checked-out" | "none"
  currentSessionStart?: string
}

export function AttendanceSummary({ period, title, subtitle }: AttendanceSummaryProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AttendanceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch data based on period
        let endpoint = "/api/attendance/current"
        if (period === "week" || period === "month") {
          endpoint = `/api/attendance/history?period=${period}`
        }

        const response = await fetch(endpoint)
        if (!response.ok) throw new Error(`Failed to fetch ${period} attendance data`)

        const result = await response.json()

        // Process data based on period
        let processedData: AttendanceData = {
          daysWorked: 0,
          totalHours: 0,
          avgHoursPerDay: 0
        }

        if (period === "today") {
          const attendance = result.attendance
          processedData = {
            daysWorked: attendance ? 1 : 0,
            totalHours: attendance?.totalHours || 0,
            avgHoursPerDay: attendance?.totalHours || 0,
            currentStatus: attendance ?
              (attendance.checkOutTime ? "checked-out" : "checked-in") :
              "none",
            currentSessionStart: attendance?.checkInTime
          }

          // Handle case when attendance is null
          if (!attendance) {
            processedData = {
              daysWorked: 0,
              totalHours: 0,
              avgHoursPerDay: 0,
              currentStatus: "none",
              currentSessionStart: undefined
            }
          }
        } else {
          // For week or month
          const records = result.attendanceRecords || []

          if (records.length === 0) {
            processedData = {
              daysWorked: 0,
              totalHours: 0,
              avgHoursPerDay: 0
            }

            // Add attendance rate for month
            if (period === "month") {
              processedData.attendanceRate = 0
            }
          } else {
            const uniqueDays = new Set(records.map((r: any) =>
              new Date(r.checkInTime).toDateString()
            )).size

            const totalHours = records.reduce((sum: number, r: any) =>
              sum + (r.totalHours || 0), 0)

            processedData = {
              daysWorked: uniqueDays,
              totalHours: parseFloat(totalHours.toFixed(2)),
              avgHoursPerDay: uniqueDays > 0 ?
                parseFloat((totalHours / uniqueDays).toFixed(2)) : 0
            }

            // Add attendance rate for month
            if (period === "month") {
              const workingDaysPerMonth = 22 // Approximate
              processedData.attendanceRate = parseFloat(
                ((uniqueDays / workingDaysPerMonth) * 100).toFixed(2)
              )
            }
          }
        }

        setData(processedData)
      } catch (err) {
        console.error(`Error fetching ${period} attendance data:`, err)
        setError(`Failed to load ${period} attendance data`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  // Generate subtitle if not provided
  const generatedSubtitle = () => {
    if (subtitle) return subtitle

    if (period === "today") {
      return format(new Date(), "EEEE, MMMM d, yyyy")
    } else if (period === "week") {
      const now = new Date()
      return `${format(startOfWeek(now), "MMM d")} - ${format(endOfWeek(now), "MMM d, yyyy")}`
    } else {
      return format(new Date(), "MMMM yyyy")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">
          {generatedSubtitle()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <div className="space-y-2">
            {period === "today" && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Status:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  data?.currentStatus === "checked-in"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {data?.currentStatus === "checked-in"
                    ? "Checked In"
                    : data?.currentStatus === "checked-out"
                      ? "Checked Out"
                      : "Not Checked In"}
                </span>
              </div>
            )}

            {period === "today" && data?.currentStatus === "checked-in" && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Current Session:</span>
                <span className="text-xs">
                  {data?.currentSessionStart
                    ? formatDistanceToNow(new Date(data.currentSessionStart), { addSuffix: true })
                    : "N/A"}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">
                {period === "today" ? "Hours Today:" : "Total Hours:"}
              </span>
              <span className="text-xs">{data?.totalHours.toFixed(2)} hrs</span>
            </div>

            {period !== "today" && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Days Present:</span>
                <span className="text-xs">
                  {data?.daysWorked} {period === "week" ? "/ 5" : ""} days
                </span>
              </div>
            )}

            {period !== "today" && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Daily Average:</span>
                <span className="text-xs">{data?.avgHoursPerDay} hrs/day</span>
              </div>
            )}

            {period === "month" && data?.attendanceRate !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Attendance Rate:</span>
                <span className="text-xs">{data.attendanceRate}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
