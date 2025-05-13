import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

/**
 * API endpoint to check if the current user has a specific permission
 * This is used by client components to verify permissions with the database-backed system
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ hasPermission: false }, { status: 200 });
    }

    // Get permission from query params
    const url = new URL(req.url);
    const permission = url.searchParams.get('permission');

    if (!permission) {
      return NextResponse.json({ hasPermission: false }, { status: 200 });
    }

    // Get userId from query params or use current user's ID
    const userId = url.searchParams.get('userId') || session.user.id;

    // Check if the user has the permission using the database-backed service
    const hasPermission = await PermissionService.hasPermissionById(userId, permission);

    // Return the result
    return NextResponse.json({ hasPermission });
  } catch (error: any) {
    console.error('Error checking permission:', error);
    return NextResponse.json({ hasPermission: false }, { status: 200 });
  }
}
