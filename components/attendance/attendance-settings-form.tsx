"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Settings, Clock, Calendar, Bell, CheckCircle2 } from "lucide-react"

interface AttendanceSettingsFormProps {
  userId?: string // Optional - if not provided, uses current user
}

interface AttendanceSettings {
  id: string
  userId: string
  workHoursPerDay: number
  workDays: string
  reminderEnabled: boolean
  reminderTime: string | null
  autoCheckoutEnabled: boolean
  autoCheckoutTime: string | null
}

const DAYS_OF_WEEK = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "0", label: "Sun" },
]

export function AttendanceSettingsForm({ userId }: AttendanceSettingsFormProps) {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [userId])

  // Parse workDays string into array when settings change
  useEffect(() => {
    if (settings?.workDays) {
      setSelectedDays(settings.workDays.split(','))
    }
  }, [settings])

  async function fetchSettings() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/attendance/settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching attendance settings:', error)
      toast({
        title: "Error",
        description: "Failed to load attendance settings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!settings) return
    
    try {
      setIsSaving(true)
      
      // Convert selected days array back to comma-separated string
      const updatedSettings = {
        ...settings,
        workDays: selectedDays.join(',')
      }
      
      const response = await fetch('/api/attendance/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update settings')
      }
      
      const data = await response.json()
      setSettings(data)
      
      toast({
        title: "Success",
        description: "Attendance settings updated successfully",
      })
    } catch (error) {
      console.error('Error updating attendance settings:', error)
      toast({
        title: "Error",
        description: "Failed to update attendance settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  function handleDayToggle(day: string) {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      } else {
        return [...prev, day].sort()
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Attendance Settings
          </CardTitle>
          <CardDescription>Loading your attendance settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Attendance Settings
        </CardTitle>
        <CardDescription>
          Configure your work schedule and attendance preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            {/* Work Days Section */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                <h3 className="text-sm font-medium">Work Days</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <Badge 
                    key={day.value}
                    variant={selectedDays.includes(day.value) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Work Hours Section */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <h3 className="text-sm font-medium">Work Hours</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workHoursPerDay">Hours Per Day</Label>
                  <Input
                    id="workHoursPerDay"
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={settings?.workHoursPerDay || 8}
                    onChange={e => setSettings(prev => prev ? {...prev, workHoursPerDay: parseFloat(e.target.value)} : null)}
                  />
                </div>
              </div>
            </div>

            {/* Reminders Section */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-2 text-primary" />
                <h3 className="text-sm font-medium">Reminders</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminderEnabled" className="cursor-pointer">Enable Check-in Reminders</Label>
                  <Switch
                    id="reminderEnabled"
                    checked={settings?.reminderEnabled || false}
                    onCheckedChange={checked => setSettings(prev => prev ? {...prev, reminderEnabled: checked} : null)}
                  />
                </div>
                {settings?.reminderEnabled && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="reminderTime">Reminder Time</Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={settings?.reminderTime || "09:00"}
                      onChange={e => setSettings(prev => prev ? {...prev, reminderTime: e.target.value} : null)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Auto-Checkout Section */}
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                <h3 className="text-sm font-medium">Auto-Checkout</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoCheckoutEnabled" className="cursor-pointer">Enable Auto-Checkout</Label>
                  <Switch
                    id="autoCheckoutEnabled"
                    checked={settings?.autoCheckoutEnabled || false}
                    onCheckedChange={checked => setSettings(prev => prev ? {...prev, autoCheckoutEnabled: checked} : null)}
                  />
                </div>
                {settings?.autoCheckoutEnabled && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="autoCheckoutTime">Auto-Checkout Time</Label>
                    <Input
                      id="autoCheckoutTime"
                      type="time"
                      value={settings?.autoCheckoutTime || "17:00"}
                      onChange={e => setSettings(prev => prev ? {...prev, autoCheckoutTime: e.target.value} : null)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
