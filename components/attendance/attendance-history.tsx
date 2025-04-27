"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Search, Filter, ChevronLeft, ChevronRight, Laptop, Info, ExternalLink, MoreHorizontal } from "lucide-react"
import { startOfWeek, endOfWeek } from "date-fns"
import { getDeviceInfo } from "@/lib/geo-utils"
import { LocationMap } from "@/components/attendance/location-map"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, differenceInHours, differenceInMinutes } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AttendanceHistory() {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [groupedRecords, setGroupedRecords] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [groupBy, setGroupBy] = useState<string | null>(null)

  useEffect(() => {
    fetchAttendanceHistory()
  }, [page, groupBy])

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true)
      let url = `/api/attendance/history?page=${page}&limit=10`
      if (groupBy) {
        url += `&groupBy=${groupBy}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setAttendanceRecords(data.attendanceRecords)

        // Debug the grouped records
        console.log('Grouped records from API:', data.groupedRecords)

        // Make sure we're getting the grouped records correctly
        if (data.groupedRecords && Array.isArray(data.groupedRecords)) {
          setGroupedRecords(data.groupedRecords)
        } else {
          setGroupedRecords([])
          console.error('Invalid grouped records format:', data.groupedRecords)
        }

        setTotalPages(data.pagination.totalPages)
        setError(null)
      } else {
        setError(data.error || "Failed to load attendance history")
        toast({
          title: "Error",
          description: data.error || "Failed to load attendance history",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error fetching attendance history:", err)
      setError("Failed to load attendance history")
      toast({
        title: "Error",
        description: "Failed to load attendance history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", searchQuery)
    // Reset to page 1 when searching
    setPage(1)
    fetchAttendanceHistory()
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const calculateDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "In progress"

    try {
      const start = new Date(checkIn)
      const end = new Date(checkOut)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid time"
      }

      const hours = differenceInHours(end, start)
      const minutes = differenceInMinutes(end, start) % 60

      return `${hours}h ${minutes}m`
    } catch (error) {
      console.error("Error calculating duration:", error)
      return "Error"
    }
  }

  // Safe date formatting function
  const safeFormat = (date: string | Date | null, formatString: string, fallback: string = "N/A") => {
    if (!date) return fallback

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return fallback
      return format(dateObj, formatString)
    } catch (error) {
      console.error("Error formatting date:", error, date)
      return fallback
    }
  }

  const viewLocationDetails = (record: any) => {
    setSelectedRecord(record)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by date..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm whitespace-nowrap">Group by:</span>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 sm:flex-none"
            value={groupBy || ''}
            onChange={(e) => setGroupBy(e.target.value || null)}
          >
            <option value="">None</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-muted-foreground">
              {error}
            </div>
          ) : attendanceRecords.length === 0 && groupedRecords.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No attendance records found
            </div>
          ) : groupBy ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Check-ins</TableHead>
                    {!isMobile && <TableHead>Total Hours</TableHead>}
                    {!isMobile && <TableHead>Avg. Hours/Day</TableHead>}
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedRecords.map((group) => (
                    <TableRow key={group.period}>
                      <TableCell className="font-medium">
                        {groupBy === 'day' ? (
                          safeFormat(group.period, "EEEE, MMMM d, yyyy", group.period)
                        ) : groupBy === 'week' ? (
                          <span title={group.period}>{group.period}</span>
                        ) : groupBy === 'month' ? (
                          safeFormat(`${group.period}-01`, "MMMM yyyy", group.period)
                        ) : (
                          group.period
                        )}
                      </TableCell>
                      <TableCell>
                        {group.checkInCount} check-ins
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {group.totalHours.toFixed(2)} hours
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          {group.averageHoursPerDay.toFixed(2)} hours/day
                        </TableCell>
                      )}
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>
                                {groupBy === 'day' ? (
                                  safeFormat(group.period, "EEEE, MMMM d, yyyy", group.period)
                                ) : groupBy === 'week' ? (
                                  `Week: ${group.period}`
                                ) : groupBy === 'month' ? (
                                  safeFormat(group.period + "-01", "MMMM yyyy", group.period)
                                ) : (
                                  group.period
                                )}
                              </DialogTitle>
                              <DialogDescription>
                                {group.checkInCount} check-ins, {group.totalHours.toFixed(2)} total hours
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-auto">
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="whitespace-nowrap">Date</TableHead>
                                      <TableHead className="whitespace-nowrap">Check In</TableHead>
                                      <TableHead className="whitespace-nowrap">Check Out</TableHead>
                                      <TableHead className="whitespace-nowrap">Duration</TableHead>
                                      <TableHead className="whitespace-nowrap">Location</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.records.map((record: any) => (
                                      <TableRow key={record.id}>
                                        <TableCell className="whitespace-nowrap">
                                          {safeFormat(record.checkInTime, "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {safeFormat(record.checkInTime, "h:mm a")}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {record.checkOutTime
                                            ? safeFormat(record.checkOutTime, "h:mm a", "Invalid time")
                                            : "In progress"}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {calculateDuration(record.checkInTime, record.checkOutTime)}
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => viewLocationDetails(record)}
                                          >
                                            <MapPin className="h-4 w-4" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    {!isMobile && <TableHead>Check Out</TableHead>}
                    {!isMobile && <TableHead>Duration</TableHead>}
                    <TableHead>Location</TableHead>
                    {isMobile && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {safeFormat(record.checkInTime, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {safeFormat(record.checkInTime, "h:mm a")}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {record.checkOutTime
                            ? safeFormat(record.checkOutTime, "h:mm a", "Invalid time")
                            : "In progress"}
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          {calculateDuration(record.checkInTime, record.checkOutTime)}
                        </TableCell>
                      )}
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => viewLocationDetails(record)}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Location Details</DialogTitle>
                              <DialogDescription>
                                Attendance record for {safeFormat(record.checkInTime, "MMMM d, yyyy")}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
                              <div className="space-y-4">
                                <h4 className="font-medium flex items-center gap-2">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  Check-in Location
                                </h4>
                                {record.checkInLatitude && record.checkInLongitude ? (
                                  <div className="text-sm space-y-2">
                                    <div className="space-y-2">
                                      <div className="bg-muted/50 p-3 rounded-md">
                                        <p className="font-medium break-words">{record.checkInLocationName || 'Location name not available'}</p>
                                        <p className="text-xs text-muted-foreground mt-1 break-all">
                                          <span className="inline-block">Coordinates: </span>
                                          <span className="inline-block">{record.checkInLatitude.toFixed(6)}, {record.checkInLongitude.toFixed(6)}</span>
                                        </p>
                                      </div>

                                      <LocationMap
                                        latitude={record.checkInLatitude}
                                        longitude={record.checkInLongitude}
                                        className="h-48 w-full rounded-md overflow-hidden"
                                      />
                                      <a
                                        href={`https://www.openstreetmap.org/?mlat=${record.checkInLatitude}&mlon=${record.checkInLongitude}#map=16/${record.checkInLatitude}/${record.checkInLongitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs flex items-center gap-1 text-primary hover:underline"
                                      >
                                        View larger map <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                      <p className="text-xs text-muted-foreground">
                                        {safeFormat(record.checkInTime, "MMM d, yyyy 'at' h:mm:ss a")}
                                      </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Laptop className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                      <p className="text-xs text-muted-foreground break-words">
                                        {record.checkInDeviceInfo ? getDeviceInfo(record.checkInDeviceInfo) : 'Device information not available'}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No location data available</p>
                                )}
                              </div>

                              {record.checkOutTime && (
                                <div className="space-y-4 border-t pt-4">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    Check-out Location
                                  </h4>
                                  {record.checkOutLatitude && record.checkOutLongitude ? (
                                    <div className="text-sm space-y-2">
                                      <div className="space-y-2">
                                        <div className="bg-muted/50 p-3 rounded-md">
                                          <p className="font-medium break-words">{record.checkOutLocationName || 'Location name not available'}</p>
                                          <p className="text-xs text-muted-foreground mt-1 break-all">
                                            <span className="inline-block">Coordinates: </span>
                                            <span className="inline-block">{record.checkOutLatitude.toFixed(6)}, {record.checkOutLongitude.toFixed(6)}</span>
                                          </p>
                                        </div>

                                        <LocationMap
                                          latitude={record.checkOutLatitude}
                                          longitude={record.checkOutLongitude}
                                          className="h-48 w-full rounded-md overflow-hidden"
                                        />
                                        <a
                                          href={`https://www.openstreetmap.org/?mlat=${record.checkOutLatitude}&mlon=${record.checkOutLongitude}#map=16/${record.checkOutLatitude}/${record.checkOutLongitude}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs flex items-center gap-1 text-primary hover:underline"
                                        >
                                          View larger map <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <p className="text-xs text-muted-foreground">
                                          {safeFormat(record.checkOutTime, "MMM d, yyyy 'at' h:mm:ss a")}
                                        </p>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <Laptop className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-muted-foreground break-words">
                                          {record.checkOutDeviceInfo ? getDeviceInfo(record.checkOutDeviceInfo) : 'Device information not available'}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No location data available</p>
                                  )}
                                </div>
                              )}

                              <div className="bg-primary/5 p-4 rounded-md text-sm border">
                                <p className="font-medium flex items-center gap-2">
                                  <Info className="h-4 w-4 flex-shrink-0" />
                                  Session Summary
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p><span className="text-muted-foreground">Duration:</span> {calculateDuration(record.checkInTime, record.checkOutTime)}</p>
                                  {record.totalHours && <p><span className="text-muted-foreground">Total Hours:</span> {record.totalHours.toFixed(2)} hours</p>}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      {isMobile && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Clock className="h-3.5 w-3.5 mr-2" />
                                {record.checkOutTime
                                  ? safeFormat(record.checkOutTime, "h:mm a", "Invalid time")
                                  : "In progress"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Info className="h-3.5 w-3.5 mr-2" />
                                {calculateDuration(record.checkInTime, record.checkOutTime)}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page <= 1}
                    className="flex-1 sm:flex-initial"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {!isMobile && "Previous"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                    className="flex-1 sm:flex-initial"
                  >
                    {!isMobile && "Next"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
