"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Calendar, CheckCircle, Clock, Filter, Search, XCircle, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays, format, isValid } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { EXCEPTION_TYPES, STATUS_COLORS } from "@/lib/constants/attendance"

// Exception types from backend
export type ExceptionType = 'absent' | 'late' | 'forgot_checkout' | 'pattern';

interface AttendanceException {
  id: string
  userId: string
  userName: string
  userEmail: string
  userImage?: string
  type: ExceptionType
  date: string
  details: string
  status: 'new' | 'acknowledged' | 'resolved'
  teamId?: string
  teamName?: string
  department?: string
}

export function AttendanceExceptionsSummary() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [exceptions, setExceptions] = useState<AttendanceException[]>([])
  const [filteredExceptions, setFilteredExceptions] = useState<AttendanceException[]>([])
  const [exceptionType, setExceptionType] = useState<ExceptionType | "all">("all")
  const [status, setStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: addDays(new Date(), -30),
    to: new Date()
  })

  // Fetch exceptions data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        
        // Add filters to query
        if (exceptionType !== "all") {
          params.append("type", exceptionType)
        }
        
        if (status !== "all") {
          params.append("status", status)
        }
        
        if (dateRange.from && isValid(dateRange.from)) {
          params.append("startDate", format(dateRange.from, "yyyy-MM-dd"))
        }
        
        if (dateRange.to && isValid(dateRange.to)) {
          params.append("endDate", format(dateRange.to, "yyyy-MM-dd"))
        }
        
        // Make API call with constructed URL
        const url = `/api/attendance/exceptions${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Error fetching attendance exceptions: ${response.status}`)
        }
        
        const data = await response.json()
        setExceptions(data.exceptions || [])
        
      } catch (error) {
        console.error("Failed to fetch attendance exceptions:", error)
        toast({
          title: "Error",
          description: "Failed to load attendance exceptions. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [exceptionType, status, dateRange, toast])

  // Apply search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredExceptions(exceptions)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = exceptions.filter(exception => 
      exception.userName?.toLowerCase().includes(query) ||
      exception.userEmail?.toLowerCase().includes(query) ||
      exception.department?.toLowerCase().includes(query) ||
      exception.details?.toLowerCase().includes(query)
    )
    
    setFilteredExceptions(filtered)
  }, [exceptions, searchQuery])

  // Handle exception status update
  const updateExceptionStatus = async (exceptionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/attendance/exceptions/${exceptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error(`Error updating exception status: ${response.status}`)
      }
      
      // Update local state
      setExceptions(prev => prev.map(exception => 
        exception.id === exceptionId
          ? { ...exception, status: newStatus as 'new' | 'acknowledged' | 'resolved' }
          : exception
      ))
      
      toast({
        title: "Status updated",
        description: `Exception marked as ${newStatus}`,
      })
      
    } catch (error) {
      console.error("Failed to update exception status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Get exception type icon
  const getExceptionIcon = (type: ExceptionType) => {
    switch(type) {
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'late':
        return <Clock className="h-4 w-4 text-amber-500" />
      case 'forgot_checkout':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'pattern':
        return <AlertTriangle className="h-4 w-4 text-purple-500" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Get status badge based on status value
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new':
        return <Badge variant="destructive">New</Badge>
      case 'acknowledged':
        return <Badge variant="outline">Acknowledged</Badge>
      case 'resolved':
        return <Badge variant="secondary">Resolved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Exceptions</CardTitle>
        <CardDescription>
          Review and manage attendance exceptions requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email or department..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={exceptionType} onValueChange={setExceptionType as (value: string) => void}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Exception</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={EXCEPTION_TYPES.ABSENT}>Absent</SelectItem>
                <SelectItem value={EXCEPTION_TYPES.LATE}>Late Arrival</SelectItem>
                <SelectItem value={EXCEPTION_TYPES.FORGOT_CHECKOUT}>Forgot Checkout</SelectItem>
                <SelectItem value={EXCEPTION_TYPES.PATTERN}>Pattern</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            
            <DatePickerWithRange 
              className="w-full sm:w-auto"
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>
        
        {/* Exceptions table */}
        {loading ? (
          // Loading skeleton
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredExceptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>No exceptions found matching your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExceptions.map(exception => (
                  <TableRow key={exception.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={exception.userImage} />
                          <AvatarFallback>
                            {exception.userName?.substring(0, 2) || exception.userEmail?.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{exception.userName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{exception.userEmail}</div>
                          {exception.department && (
                            <div className="text-xs text-muted-foreground">{exception.department}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getExceptionIcon(exception.type)}
                        <span className="capitalize">
                          {exception.type.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(exception.date), "MMM d, yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate" title={exception.details}>
                        {exception.details}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(exception.status)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {exception.status === 'new' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateExceptionStatus(exception.id, 'acknowledged')}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {(exception.status === 'new' || exception.status === 'acknowledged') && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => updateExceptionStatus(exception.id, 'resolved')}
                        >
                          Resolve
                        </Button>
                      )}
                      {exception.status === 'resolved' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateExceptionStatus(exception.id, 'new')}
                        >
                          Reopen
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}