"use client"

import { useSession } from "next-auth/react"
import { ReactNode } from "react"

interface RoleGuardProps {
  roles: string[]
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that only renders its children if the user has one of the specified roles
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role || "guest"
  
  if (!roles.includes(userRole)) {
    return fallback
  }
  
  return <>{children}</>
}
