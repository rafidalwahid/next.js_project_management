"use client"

import { signOut } from "next-auth/react"
import { toast } from "@/components/ui/use-toast"

/**
 * Checks out the user (if currently checked in) and then logs them out
 * @param callbackUrl Optional URL to redirect to after logout
 */
export async function checkOutAndLogout(callbackUrl: string = '/login') {
  try {
    // First, check if the user is currently checked in
    const response = await fetch('/api/attendance/current')
    const data = await response.json()

    // If the user is checked in (has an active attendance record without checkout time)
    if (response.ok && data.attendance && !data.attendance.checkOutTime) {
      try {
        // Get current position if available
        let position: GeolocationPosition | null = null
        try {
          position = await getCurrentPosition()
        } catch (error) {
          console.error("Error getting position for auto-checkout:", error)
          // Continue without position data
        }

        // Prepare check-out data
        const checkOutData = {
          attendanceId: data.attendance.id,
          latitude: position?.coords.latitude,
          longitude: position?.coords.longitude,
          timestamp: new Date().toISOString(),
        }

        // Call the check-out API
        const checkoutResponse = await fetch('/api/attendance/check-out', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkOutData),
        })

        if (checkoutResponse.ok) {
          toast({
            title: "Checked Out",
            description: "You've been automatically checked out as part of the logout process.",
          })
        } else {
          console.error("Failed to auto-checkout during logout")
        }
      } catch (error) {
        console.error("Error during auto-checkout:", error)
        // Continue with logout even if checkout fails
      }
    }

    // Finally, log the user out
    await signOut({ callbackUrl })
  } catch (error) {
    console.error("Error during checkout and logout:", error)
    // If anything fails, still try to log the user out
    await signOut({ callbackUrl })
  }
}

/**
 * Get current position with geolocation API
 */
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        console.error("Geolocation error:", error)
        reject(error)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}
