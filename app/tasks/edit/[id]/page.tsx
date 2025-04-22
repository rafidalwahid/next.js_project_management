"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function EditTaskRedirectPage() {
  const params = useParams()
  const taskId = params.id as string
  const router = useRouter()

  useEffect(() => {
    // Redirect to the task view page
    router.replace(`/tasks/${taskId}`)
  }, [taskId, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to task details...</p>
    </div>
  )
}
