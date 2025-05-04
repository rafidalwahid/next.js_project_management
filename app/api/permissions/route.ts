import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PermissionService } from "@/lib/permissions/permission-service";

// GET /api/permissions - Get all permissions
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

    // Get all permissions
    const permissions = await PermissionService.getAllPermissions();

    // Return the permissions
    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/permissions - Create a new permission
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

    // For now, allow any authenticated admin to access this endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { name, description, category } = body;

    // Validate permission data
    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // In the centralized permission system, permissions are defined in code
    // This endpoint is kept for backward compatibility but doesn't actually create permissions
    return NextResponse.json(
      {
        error: 'Creating permissions dynamically is not supported in the centralized permission system',
        message: 'Permissions are now defined in code in lib/permissions/unified-permission-system.ts'
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/permissions?name={permissionName} - Delete a permission
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

    // For now, allow any authenticated admin to access this endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get permission name from query params
    const url = new URL(req.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // In the centralized permission system, permissions are defined in code
    // This endpoint is kept for backward compatibility but doesn't actually delete permissions
    return NextResponse.json(
      {
        error: 'Deleting permissions dynamically is not supported in the centralized permission system',
        message: 'Permissions are now defined in code in lib/permissions/unified-permission-system.ts'
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission', details: error.message },
      { status: 500 }
    );
  }
}
