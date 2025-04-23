import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { RolePermissionService } from "@/lib/services/role-permission-service";
import prisma from "@/lib/prisma";

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
    const permissions = await RolePermissionService.getAllPermissions();

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

    // Check if user has permission to create permissions
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
    const { name, description, category } = body;

    // Validate permission data
    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission already exists' },
        { status: 409 }
      );
    }

    // Create the permission
    const permission = await RolePermissionService.createPermission(
      name,
      description || '',
      category || 'general'
    );

    // Return the created permission
    return NextResponse.json(permission, { status: 201 });
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

    // Check if user has permission to manage permissions
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

    // Get permission name from query params
    const url = new URL(req.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { name },
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if it's a system permission
    if (permission.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system permissions' },
        { status: 403 }
      );
    }

    // Delete the permission
    await prisma.permission.delete({
      where: { id: permission.id },
    });

    // Return success
    return NextResponse.json({
      message: `Permission '${name}' deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission', details: error.message },
      { status: 500 }
    );
  }
}
