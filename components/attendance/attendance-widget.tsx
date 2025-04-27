"use client"

import { useState, useEffect } from "react"
import { Clock, MapPin, LogIn, LogOut, Laptop, Info, ExternalLink, Calendar, CheckCircle, AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow, format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { getDeviceInfo } from "@/lib/geo-utils"
import { LocationMap } from "@/components/attendance/location-map"

export function AttendanceWidget() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [currentAttendance, setCurrentAttendance] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchCurrentAttendance()
    }
  }, [session?.user?.id])

  const fetchCurrentAttendance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/attendance/current')
      const data = await response.json()

      if (response.ok) {
        setCurrentAttendance(data.attendance)
        setError(null)
      } else {
        setError(data.error || "Failed to load attendance data")
      }
    } catch (err) {
      console.error("Error fetching attendance:", err)
      setError("Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true)
      setError(null)

      // Get current position
      const position = await getCurrentPosition()

      // Send check-in request
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentAttendance(data.attendance)
        toast({
          title: "Checked In",
          description: "Your attendance has been recorded successfully.",
        })
      } else {
        setError(data.error || "Failed to check in")
        toast({
          title: "Check-in Failed",
          description: data.error || "Failed to check in. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Check-in error:", err)
      setError(err.message || "Failed to check in. Please try again.")
      toast({
        title: "Check-in Failed",
        description: err.message || "Failed to check in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true)
      setError(null)

      // Get current position
      const position = await getCurrentPosition()

      // Send check-out request
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceId: currentAttendance.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentAttendance(data.attendance)
        toast({
          title: "Checked Out",
          description: "Your check-out has been recorded successfully.",
        })
      } else {
        setError(data.error || "Failed to check out")
        toast({
          title: "Check-out Failed",
          description: data.error || "Failed to check out. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Check-out error:", err)
      setError(err.message || "Failed to check out. Please try again.")
      toast({
        title: "Check-out Failed",
        description: err.message || "Failed to check out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckingOut(false)
    }
  }

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          console.error("Geolocation error:", error)
          reject(new Error("Unable to retrieve your location. Please enable location services."))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }

  if (loading) {
    return (
      <Card className="overflow-hidden border shadow-md bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            <CardTitle className="text-base font-medium">Attendance Tracker</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            Record your work hours with geolocation tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-2 w-2 rounded-full bg-primary/70 mr-2"></div>
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="space-y-4 md:space-y-5">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="ml-6 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-[90%]" />
                    <Skeleton className="h-3 w-[80%]" />
                  </div>
                </div>
                <Skeleton className="h-[180px] w-full rounded-lg" />
              </div>
            </div>
            <div>
              <div className="flex items-center mb-4">
                <div className="h-2 w-2 rounded-full bg-primary/70 mr-2"></div>
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="pt-3 mt-2 border-t flex justify-center">
                  <Skeleton className="h-3 w-[80%] sm:w-48" />
                </div>
                <div className="flex justify-center sm:justify-end mt-2">
                  <Skeleton className="h-9 w-full sm:w-24 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-primary" />
          <CardTitle className="text-base font-medium">Attendance Tracker</CardTitle>
        </div>
        <CardDescription className="text-xs mt-1">
          Record your work hours with geolocation tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        {error && (
          <div className="mb-5 p-3 bg-destructive/10 text-destructive rounded-md text-xs flex items-center gap-2 border border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left column */}
          <div>
            <div className="flex items-center mb-4">
              <div className="h-2 w-2 rounded-full bg-primary/70 mr-2"></div>
              <h3 className="text-xs font-medium uppercase tracking-wider">STATUS</h3>
            </div>

            {currentAttendance && !currentAttendance.checkOutTime ? (
              <div className="space-y-4 md:space-y-5">
                <div className="flex items-center bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                      <span className="truncate">Currently Checked In</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] h-5 flex-shrink-0">Active</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {formatDistanceToNow(new Date(currentAttendance.checkInTime), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-muted/30 p-3 rounded-lg border">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    <div className="text-sm font-medium">Location</div>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="text-xs font-medium break-words">
                      {currentAttendance.checkInLocationName || 'Location name not available'}
                    </div>
                    <div className="text-xs text-muted-foreground break-all">
                      <span className="inline-block">Coordinates: </span>
                      <span className="inline-block">{currentAttendance.checkInLatitude?.toFixed(6)}, {currentAttendance.checkInLongitude?.toFixed(6)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{format(new Date(currentAttendance.checkInTime), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  </div>
                </div>

                {currentAttendance.checkInLatitude && currentAttendance.checkInLongitude && (
                  <div className="relative border rounded-lg overflow-hidden shadow-sm">
                    <LocationMap
                      latitude={currentAttendance.checkInLatitude}
                      longitude={currentAttendance.checkInLongitude}
                      className="h-[180px] w-full"
                    />
                    <div className="absolute bottom-0 right-0 p-1.5 bg-background/90 text-xs rounded-tl-md backdrop-blur-sm">
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${currentAttendance.checkInLatitude}&mlon=${currentAttendance.checkInLongitude}#map=16/${currentAttendance.checkInLatitude}/${currentAttendance.checkInLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        View larger map <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border">
                {currentAttendance ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="bg-muted/50 p-2 rounded-full mr-3 flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                          <span className="truncate">Checked Out</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] h-5 flex-shrink-0">Complete</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          Last session: {formatDistanceToNow(new Date(currentAttendance.checkOutTime || currentAttendance.checkInTime), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="bg-muted/50 p-2 rounded-full mr-3 flex-shrink-0">
                      <Info className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm">You haven't checked in today</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div>
            <div className="flex items-center mb-4">
              <div className="h-2 w-2 rounded-full bg-primary/70 mr-2"></div>
              <h3 className="text-xs font-medium uppercase tracking-wider">DEVICE INFO</h3>
            </div>

            {currentAttendance && currentAttendance.checkInDeviceInfo ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs">
                  <div className="font-medium">Device Name:</div>
                  <div className="text-muted-foreground break-words">
                    {currentAttendance.checkInDeviceInfo ?
                      getDeviceInfo(currentAttendance.checkInDeviceInfo).split(' - ')[0] :
                      'Unknown'}
                  </div>

                  <div className="font-medium">Device Type:</div>
                  <div className="text-muted-foreground break-words">
                    {currentAttendance.checkInDeviceInfo ?
                      getDeviceInfo(currentAttendance.checkInDeviceInfo).split(' - ')[1] :
                      'Unknown'}
                  </div>

                  <div className="font-medium">Operating System:</div>
                  <div className="text-muted-foreground break-words">
                    {currentAttendance.checkInDeviceInfo ?
                      getDeviceInfo(currentAttendance.checkInDeviceInfo).split(' - ')[2] :
                      'Unknown'}
                  </div>

                  <div className="font-medium">Browser:</div>
                  <div className="text-muted-foreground break-words">
                    {currentAttendance.checkInDeviceInfo ?
                      getDeviceInfo(currentAttendance.checkInDeviceInfo).split(' - ')[3] :
                      'Unknown'}
                  </div>

                  <div className="font-medium">IP Address:</div>
                  <div className="text-muted-foreground break-words">
                    {currentAttendance.checkInIpAddress || 'Unknown'}
                  </div>
                </div>

                <div className="text-xs text-center text-muted-foreground border-t pt-3 mt-2">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  Location is only recorded during check-in/out
                </div>

                <div className="flex justify-center sm:justify-end mt-4">
                  {currentAttendance && !currentAttendance.checkOutTime ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckOut}
                      disabled={checkingOut}
                      className="text-xs w-full sm:w-auto"
                    >
                      {checkingOut ? (
                        <>
                          <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Check Out <LogOut className="ml-1 h-3 w-3" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckIn}
                      disabled={checkingIn}
                      className="text-xs w-full sm:w-auto"
                    >
                      {checkingIn ? (
                        <>
                          <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Check In <LogIn className="ml-1 h-3 w-3" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Device information will be available after check-in
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="w-full text-xs"
                >
                  {checkingIn ? (
                    <>
                      <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Check In <LogIn className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
