import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { RolePermissionService } from "@/lib/services/role-permission-service";

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

    // Check if user has permission to view role permissions
    const hasPermission = await RolePermissionService.hasPermission(
      session.user.id,
      'manage_roles'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get the permission matrix from the database
    const permissionMatrix = await RolePermissionService.getPermissionMatrix();

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

    // Check if user has permission to update role permissions
    const hasPermission = await RolePermissionService.hasPermission(
      session.user.id,
      'manage_roles'
    );

    if (!hasPermission) {
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
    const results = {};
    for (const [roleName, permissionNames] of Object.entries(permissions)) {
      if (Array.isArray(permissionNames)) {
        const success = await RolePermissionService.updateRolePermissions(
          roleName,
          permissionNames as string[]
        );
        results[roleName] = success;
      }
    }

    // Return success
    return NextResponse.json({
      message: 'Role permissions updated successfully',
      results
    });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions', details: error.message },
      { status: 500 }
    );
  }
}
