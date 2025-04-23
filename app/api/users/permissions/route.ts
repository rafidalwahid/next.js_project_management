import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { RolePermissionService } from "@/lib/services/role-permission-service";

// GET /api/users/permissions?userId={userId} - Get permissions for a user
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.user.id;

    // If requesting permissions for another user, check if the current user has permission
    if (userId !== session.user.id) {
      const hasPermission = await RolePermissionService.hasPermission(
        session.user.id,
        'user_management'
      );

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to view other users\' permissions' },
          { status: 403 }
        );
      }
    }

    // Get the user's permissions
    const permissions = await RolePermissionService.getPermissionsForUser(userId);

    // Return the permissions
    return NextResponse.json({ permissions });
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user permissions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users/permissions - Grant a permission to a user
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage permissions
    const hasPermission = await RolePermissionService.hasPermission(
      session.user.id,
      'user_management'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { userId, permissionName } = body;

    // Validate request data
    if (!userId || !permissionName) {
      return NextResponse.json(
        { error: 'User ID and permission name are required' },
        { status: 400 }
      );
    }

    // Grant the permission to the user
    const success = await RolePermissionService.grantPermissionToUser(userId, permissionName);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to grant permission' },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      message: `Permission '${permissionName}' granted to user successfully`,
    });
  } catch (error: any) {
    console.error('Error granting permission to user:', error);
    return NextResponse.json(
      { error: 'Failed to grant permission', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/permissions - Remove a permission from a user
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage permissions
    const hasPermission = await RolePermissionService.hasPermission(
      session.user.id,
      'user_management'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const permissionName = url.searchParams.get('permission');

    // Validate request data
    if (!userId || !permissionName) {
      return NextResponse.json(
        { error: 'User ID and permission name are required' },
        { status: 400 }
      );
    }

    // Remove the permission from the user
    const success = await RolePermissionService.removePermissionFromUser(userId, permissionName);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove permission' },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      message: `Permission '${permissionName}' removed from user successfully`,
    });
  } catch (error: any) {
    console.error('Error removing permission from user:', error);
    return NextResponse.json(
      { error: 'Failed to remove permission', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/users/permissions - Deny a permission to a user
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage permissions
    const hasPermission = await RolePermissionService.hasPermission(
      session.user.id,
      'user_management'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { userId, permissionName } = body;

    // Validate request data
    if (!userId || !permissionName) {
      return NextResponse.json(
        { error: 'User ID and permission name are required' },
        { status: 400 }
      );
    }

    // Deny the permission to the user
    const success = await RolePermissionService.denyPermissionToUser(userId, permissionName);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to deny permission' },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      message: `Permission '${permissionName}' denied for user successfully`,
    });
  } catch (error: any) {
    console.error('Error denying permission to user:', error);
    return NextResponse.json(
      { error: 'Failed to deny permission', details: error.message },
      { status: 500 }
    );
  }
}
