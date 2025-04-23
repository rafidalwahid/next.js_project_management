import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { RolePermissionService } from "@/lib/services/role-permission-service";
import prisma from "@/lib/prisma";

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
    const roles = await RolePermissionService.getAllRoles();

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

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 409 }
      );
    }

    // Create the role
    const role = await RolePermissionService.createRole({
      name,
      description: description || ''
    });

    // Return the created role
    return NextResponse.json(role, { status: 201 });
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

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { name },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if it's a system role
    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 403 }
      );
    }

    // Delete the role
    await prisma.role.delete({
      where: { id: role.id },
    });

    // Return success
    return NextResponse.json({
      message: `Role '${name}' deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role', details: error.message },
      { status: 500 }
    );
  }
}
