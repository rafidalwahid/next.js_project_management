"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useAuthSession } from "@/hooks/use-auth-session"
import { toast } from "sonner"
import { UnifiedPermissionSystem } from "@/lib/permissions/unified-permission-system"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requiredPermission?: string
}

export function AuthGuard({
  children,
  allowedRoles,
  requiredPermission
}: AuthGuardProps) {
  const { session, status, checkSession } = useAuthSession()
  const router = useRouter()
  const pathname = usePathname()

  // Use ref to track if we've checked the session already
  const sessionChecked = useRef(false)

  // Public paths that don't require authentication
  const isPublicPath = pathname.includes("/login") ||
                       pathname.includes("/register") ||
                       pathname === "/"

  useEffect(() => {
    // Do nothing while authentication status is loading
    if (status === "loading") return

    // Redirect if user is not logged in and trying to access a protected route
    if (status === "unauthenticated" && !isPublicPath) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // If authenticated, verify the session is still valid
    if (status === "authenticated" && !sessionChecked.current) {
      // Only check the session once when the component mounts
      // or when the pathname changes (navigation)
      sessionChecked.current = true

      checkSession().catch(() => {
        // Session check failed, but we'll let the hook handle the redirect
      })
    }

    // Check role-based access if roles are specified
    if (
      status === "authenticated" &&
      allowedRoles &&
      allowedRoles.length > 0 &&
      session?.user?.role &&
      !allowedRoles.includes(session.user.role)
    ) {
      toast.error("Access denied", {
        description: "You don't have permission to access this page",
        duration: 5000,
      })
      router.push("/dashboard")
      return
    }

    // Check permission-based access if a permission is specified
    if (
      status === "authenticated" &&
      requiredPermission &&
      session?.user?.role &&
      !UnifiedPermissionSystem.hasPermission(session.user.role, requiredPermission)
    ) {
      toast.error("Access denied", {
        description: "You don't have permission to access this page",
        duration: 5000,
      })
      router.push("/dashboard")
      return
    }
  }, [status, router, pathname, session, allowedRoles, requiredPermission, checkSession, isPublicPath])

  // Show minimal loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  // Show children if user is authenticated and has the required roles/permissions
  if (
    status === "authenticated" &&
    (!allowedRoles || allowedRoles.length === 0 || (session?.user?.role && allowedRoles.includes(session.user.role))) &&
    (!requiredPermission || (session?.user?.role && UnifiedPermissionSystem.hasPermission(session.user.role, requiredPermission)))
  ) {
    return <>{children}</>
  }

  // Allow access to public pages when unauthenticated
  if (status === "unauthenticated" && isPublicPath) {
    return <>{children}</>
  }

  // Default - show nothing while redirecting
  return null
}