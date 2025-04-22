"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Search, Filter, ChevronLeft, ChevronRight, Laptop, Info, ExternalLink } from "lucide-react"
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

export function AttendanceHistory() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  useEffect(() => {
    fetchAttendanceHistory()
  }, [page])

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/attendance/history?page=${page}&limit=10`)
      const data = await response.json()

      if (response.ok) {
        setAttendanceRecords(data.attendanceRecords)
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

    const start = new Date(checkIn)
    const end = new Date(checkOut)

    const hours = differenceInHours(end, start)
    const minutes = differenceInMinutes(end, start) % 60

    return `${hours}h ${minutes}m`
  }

  const viewLocationDetails = (record: any) => {
    setSelectedRecord(record)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex items-center gap-4">
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
          ) : attendanceRecords.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No attendance records found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
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
                        {calculateDuration(record.checkInTime, record.checkOutTime)}
                      </TableCell>
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
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Location Details</DialogTitle>
                              <DialogDescription>
                                Attendance record for {format(new Date(record.checkInTime), "MMMM d, yyyy")}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="space-y-4">
                                <h4 className="font-medium flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Check-in Location
                                </h4>
                                {record.checkInLatitude && record.checkInLongitude ? (
                                  <div className="text-sm space-y-2">
                                    <div className="space-y-2">
                                      <div className="bg-muted/50 p-3 rounded-md">
                                        <p className="font-medium">{record.checkInLocationName || 'Location name not available'}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Coordinates: {record.checkInLatitude.toFixed(6)}, {record.checkInLongitude.toFixed(6)}
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
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(record.checkInTime), "MMM d, yyyy 'at' h:mm:ss a")}
                                      </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Laptop className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                      <p className="text-xs text-muted-foreground">
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
                                    <MapPin className="h-4 w-4" />
                                    Check-out Location
                                  </h4>
                                  {record.checkOutLatitude && record.checkOutLongitude ? (
                                    <div className="text-sm space-y-2">
                                      <div className="space-y-2">
                                        <div className="bg-muted/50 p-3 rounded-md">
                                          <p className="font-medium">{record.checkOutLocationName || 'Location name not available'}</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Coordinates: {record.checkOutLatitude.toFixed(6)}, {record.checkOutLongitude.toFixed(6)}
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
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(record.checkOutTime), "MMM d, yyyy 'at' h:mm:ss a")}
                                        </p>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <Laptop className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                        <p className="text-xs text-muted-foreground">
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
                                  <Info className="h-4 w-4" />
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
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
