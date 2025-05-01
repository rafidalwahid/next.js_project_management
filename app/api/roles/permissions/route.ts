import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PermissionService } from "@/lib/services/permission-service";
import { UnifiedPermissionSystem, PERMISSIONS, PERMISSION_MATRIX } from "@/lib/permissions/unified-permission-system";

// GET /api/roles/permissions - Get all role permissions
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

    // Check if user has permission to manage roles
    if (!UnifiedPermissionSystem.hasPermission(session.user.role, PERMISSIONS.MANAGE_ROLES)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get the permission matrix
    const permissionMatrix = PERMISSION_MATRIX;

    // Return the permission matrix
    return NextResponse.json(permissionMatrix);
  } catch (error: any) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role permissions', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/roles/permissions - Update role permissions
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

    // Check if user has permission to manage roles
    if (!UnifiedPermissionSystem.hasPermission(session.user.role, PERMISSIONS.MANAGE_ROLES)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { permissions } = body;

    // Validate permissions
    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json(
        { error: 'Invalid permissions data' },
        { status: 400 }
      );
    }

    // Update the permissions in the database
    const success = await PermissionService.updateAllRolePermissions(permissions);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update role permissions' },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      message: 'Role permissions updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions', details: error.message },
      { status: 500 }
    );
  }
}
