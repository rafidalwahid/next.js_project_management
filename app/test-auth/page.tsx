"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Session:</strong> {session ? "Available" : "Not available"}</p>
            {session && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
