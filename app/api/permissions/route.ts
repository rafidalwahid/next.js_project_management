import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PermissionService } from "@/lib/services/permission-service";
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
    // Note: In the simplified system, we don't actually create permissions in the database
    // This is just a placeholder for backward compatibility
    const permission = {
      id: name,
      name,
      description: description || '',
      category: category || 'general'
    };

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
