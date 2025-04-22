"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceHistory } from "@/components/attendance/attendance-history"
import { AttendanceStats } from "@/components/attendance/attendance-stats"

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Track and manage your work hours
          </p>
        </div>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="space-y-4">
          <AttendanceHistory />
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4">
          <AttendanceStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}
