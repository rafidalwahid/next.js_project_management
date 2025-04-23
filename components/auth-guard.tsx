"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Do nothing while authentication status is loading
    if (status === "loading") return

    // Redirect if user is not logged in
    if (status === "unauthenticated" && pathname !== "/login" && pathname !== "/register") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // Check role-based access if roles are specified
    if (
      status === "authenticated" &&
      allowedRoles &&
      allowedRoles.length > 0 &&
      session?.user?.role &&
      !allowedRoles.includes(session.user.role)
    ) {
      // User is logged in but doesn't have the required role
      router.push("/dashboard")
    }
  }, [status, router, pathname, session, allowedRoles])

  // Show minimal loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  // Show children if user is authenticated and has the required roles (if any)
  if (
    status === "authenticated" &&
    (!allowedRoles ||
     allowedRoles.length === 0 ||
     (session?.user?.role && allowedRoles.includes(session.user.role)))
  ) {
    return <>{children}</>
  }

  // Allow access to login and register pages when unauthenticated
  if (status === "unauthenticated" && (pathname === "/login" || pathname === "/register")) {
    return <>{children}</>
  }

  // Default - show nothing while redirecting
  return null
}