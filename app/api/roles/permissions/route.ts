import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// This is a mock implementation. In a real app, you would store this in a database
const PERMISSION_MATRIX = {
  admin: [
    "user_management", "project_creation", "task_assignment", "task_management", 
    "view_projects", "edit_profile", "system_settings", "project_management"
  ],
  manager: [
    "user_management", "project_creation", "task_assignment", "task_management", 
    "view_projects", "edit_profile", "project_management"
  ],
  user: [
    "task_management", "view_projects", "edit_profile"
  ],
  guest: [
    "view_projects"
  ]
};

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

    // Only admins can view role permissions
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Return the permission matrix
    return NextResponse.json(PERMISSION_MATRIX);
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

    // Only admins can update role permissions
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
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

    // In a real app, you would update the permissions in the database
    // For this mock implementation, we'll just return success
    
    // Return success
    return NextResponse.json({
      message: 'Role permissions updated successfully',
      permissions
    });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions', details: error.message },
      { status: 500 }
    );
  }
}
