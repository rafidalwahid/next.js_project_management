import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PERMISSIONS } from '@/lib/permissions/unified-permission-system'
import { EdgePermissionService } from '@/lib/permissions/edge-permission-service'

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/auth',
  '/api/register',
  '/api/auth-status',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts'
]

// Permission-protected paths mapping
const PROTECTED_PATHS = {
  // Admin-only paths
  '/team/permissions': PERMISSIONS.MANAGE_ROLES,
  '/team/roles': PERMISSIONS.MANAGE_ROLES,
  '/api/roles': PERMISSIONS.MANAGE_ROLES,
  '/api/permissions': PERMISSIONS.MANAGE_ROLES,

  // User management paths
  '/team/new': PERMISSIONS.USER_MANAGEMENT,
  '/api/users': PERMISSIONS.USER_MANAGEMENT,

  // Project management paths
  '/projects/new': PERMISSIONS.PROJECT_CREATION,

  // Attendance management paths
  '/attendance/admin': PERMISSIONS.ATTENDANCE_MANAGEMENT,
  '/api/attendance/admin': PERMISSIONS.ATTENDANCE_MANAGEMENT,
  '/api/attendance/admin/records': PERMISSIONS.ATTENDANCE_MANAGEMENT,
  '/api/attendance/admin/correction-requests': PERMISSIONS.ATTENDANCE_MANAGEMENT,

  // System settings paths
  '/settings': PERMISSIONS.SYSTEM_SETTINGS,
  '/api/settings': PERMISSIONS.SYSTEM_SETTINGS,
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check if the user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // If not authenticated, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url))
  }

  // Role-based access control for specific paths
  const userRole = token.role as string || 'guest'
  const userId = token.sub as string

  // Check if the path is protected by a specific permission
  for (const [protectedPath, requiredPermission] of Object.entries(PROTECTED_PATHS)) {
    if (pathname.startsWith(protectedPath)) {
      // Special case for user-specific API routes
      if (protectedPath === '/api/users') {
        // Allow users to access their own data
        const userIdInPath = pathname.match(/\/api\/users\/([^\/]+)/)?.[1]
        if (userIdInPath && userIdInPath === userId) {
          return NextResponse.next()
        }
      }

      // Check if the user has the required permission
      if (!EdgePermissionService.hasPermission(userRole, requiredPermission)) {
        // For API routes, return a JSON error
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Forbidden: Insufficient permissions' },
            { status: 403 }
          )
        }

        // For UI routes, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  // If we get here, the user is authenticated and has the required permissions
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes for authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
