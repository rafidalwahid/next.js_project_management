import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

interface Params {
  params: {
    userId: string;
  };
}

// POST /api/users/[userId]/update-last-login - Update a user's last login time (for debugging)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Check if user has permission to update this user
    // Users can update their own last login, users with user_management permission can update any user's last login
    const isOwnProfile = session.user.id === userId;
    const hasUserManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      "user_management"
    );

    if (!isOwnProfile && !hasUserManagementPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this user' },
        { status: 403 }
      );
    }

    // Update the user's last login time
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
      select: {
        id: true,
        lastLogin: true
      }
    });

    return NextResponse.json({
      message: 'Last login updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error updating last login:', error);
    return NextResponse.json(
      { error: 'Failed to update last login', details: error.message },
      { status: 500 }
    );
  }
}
