"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Loader2 } from "lucide-react"

interface AttendanceRecord {
  id: string
  userId: string
  checkInTime: string
  checkOutTime?: string | null
  totalHours?: number
  user?: {
    name?: string | null
    email: string
  }
}

interface AttendanceAdjustmentDialogProps {
  record: AttendanceRecord
  onAdjusted: () => void
  trigger?: React.ReactNode
}

export function AttendanceAdjustmentDialog({
  record,
  onAdjusted,
  trigger
}: AttendanceAdjustmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkInTime, setCheckInTime] = useState(
    record.checkInTime ? formatDateForInput(new Date(record.checkInTime)) : ""
  )
  const [checkOutTime, setCheckOutTime] = useState(
    record.checkOutTime ? formatDateForInput(new Date(record.checkOutTime)) : ""
  )
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const { toast } = useToast()

  function formatDateForInput(date: Date): string {
    try {
      return format(date, "yyyy-MM-dd'T'HH:mm")
    } catch (error) {
      console.error("Error formatting date:", error)
      return ""
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!adjustmentReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for the adjustment",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch("/api/attendance/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendanceId: record.id,
          checkInTime: checkInTime || undefined,
          checkOutTime: checkOutTime || undefined,
          adjustmentReason,
          userId: record.userId
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Attendance record adjusted successfully",
        })
        setOpen(false)
        onAdjusted()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to adjust attendance record",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adjusting attendance:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Adjust
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Attendance Record</DialogTitle>
          <DialogDescription>
            Make corrections to this attendance record. All changes will be logged.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                User
              </Label>
              <div className="col-span-3 text-sm">
                {record.user?.name || record.user?.email || "Unknown User"}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkInTime" className="text-right">
                Check-in
              </Label>
              <Input
                id="checkInTime"
                type="datetime-local"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkOutTime" className="text-right">
                Check-out
              </Label>
              <Input
                id="checkOutTime"
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="reason" className="text-right pt-2">
                Reason
              </Label>
              <Textarea
                id="reason"
                placeholder="Reason for adjustment"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
