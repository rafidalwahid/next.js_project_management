import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { RolePermissionService } from '@/lib/services/role-permission-service'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip authentication check for these paths
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/register') ||
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Check if the user is authenticated
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // If not authenticated and not on an auth page, redirect to login
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based access control for specific paths
  if (token) {
    const userRole = token.role as string || 'guest'

    // Admin-only routes
    if (pathname.startsWith('/team/permissions') || pathname.startsWith('/team/roles')) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Manager and admin routes
    if (pathname.startsWith('/team/new')) {
      if (userRole !== 'admin' && userRole !== 'manager') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Check permissions for specific API routes
    if (pathname.startsWith('/api/roles') || pathname.startsWith('/api/users')) {
      const hasUserManagementPermission = RolePermissionService.hasPermission(userRole, 'user_management')
      if (!hasUserManagementPermission) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
      }
    }
  }

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
