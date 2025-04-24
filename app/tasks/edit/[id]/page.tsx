"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function EditTaskRedirectPage() {
  const params = useParams()
  const taskId = params.id as string
  const router = useRouter()

  useEffect(() => {
    // Redirect to the task view page
    router.replace(`/tasks/${taskId}`)
  }, [taskId, router])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[70vh]">
        <p className="text-muted-foreground">Redirecting to task details...</p>
      </div>
    </DashboardLayout>
  )
}
