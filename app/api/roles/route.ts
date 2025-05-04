import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PermissionService } from "@/lib/permissions/permission-service";

// GET /api/roles - Get all roles
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

    // Get all roles
    const roles = await PermissionService.getAllRoles();

    // Return the roles
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create a new role
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
    const { name, description } = body;

    // Validate role data
    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // In the centralized permission system, roles are defined in code
    // This endpoint is kept for backward compatibility but doesn't actually create roles
    return NextResponse.json(
      {
        error: 'Creating roles dynamically is not supported in the centralized permission system',
        message: 'Roles are now defined in code in lib/permissions/unified-permission-system.ts'
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/roles?name={roleName} - Delete a role
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

    // Get role name from query params
    const url = new URL(req.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // In the centralized permission system, roles are defined in code
    // This endpoint is kept for backward compatibility but doesn't actually delete roles
    return NextResponse.json(
      {
        error: 'Deleting roles dynamically is not supported in the centralized permission system',
        message: 'Roles are now defined in code in lib/permissions/unified-permission-system.ts'
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role', details: error.message },
      { status: 500 }
    );
  }
}
