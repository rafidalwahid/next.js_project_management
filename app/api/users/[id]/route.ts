import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserById, getUserProfile, updateUser, deleteUser } from '@/lib/queries/user-queries';

// Define validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  image: z.string().url("Invalid image URL").optional().nullable(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  jobTitle: z.string().max(100, "Job title must be less than 100 characters").optional().nullable(),
  department: z.string().max(100, "Department must be less than 100 characters").optional().nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
  phone: z.string().max(20, "Phone must be less than 20 characters").optional().nullable(),
  skills: z.array(z.string()).optional(),
  socialLinks: z.object({
    twitter: z.string().url("Invalid Twitter URL").optional().nullable(),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().nullable(),
    github: z.string().url("Invalid GitHub URL").optional().nullable(),
    website: z.string().url("Invalid website URL").optional().nullable(),
  }).optional(),
});

// GET handler to get a user by ID
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await the params
    const params = await Promise.resolve(context.params);
    const userId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const includeProfile = searchParams.get('profile') === 'true';

    // Check if user is requesting their own profile or if they are an admin
    const isOwnProfile = session.user.id === userId;
    const isAdmin = session.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied: You can only view your own profile or you need admin privileges' },
        { status: 403 }
      );
    }

    // Get detailed profile or just user info
    const user = includeProfile
      ? await getUserProfile(userId)
      : await getUserById(userId, false);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await the params
    const params = await Promise.resolve(context.params);
    const userId = params.id;

    // Check if user is updating their own profile or if they are an admin
    const isOwnProfile = session.user.id === userId;
    const isAdmin = session.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied: You can only update your own profile or you need admin privileges' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    // If updating role, only admin can do it
    if (body.role && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied: Only admins can change user roles' },
        { status: 403 }
      );
    }

    // If not an admin, restrict fields that can be updated
    if (!isAdmin) {
      // Regular users can only update their profile fields but not role or other sensitive fields
      const { name, password, bio, jobTitle, department, location, phone, skills, socialLinks, image } = body;
      const updatedUser = await updateUser(userId, {
        name, password, bio, jobTitle, department, location, phone, skills, socialLinks, image
      });
      return NextResponse.json(updatedUser);
    }

    // Admin can update all fields including role
    const updatedUser = await updateUser(userId, body);
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required for user deletion' },
        { status: 403 }
      );
    }

    // Await the params
    const params = await Promise.resolve(context.params);
    const userId = params.id;

    // Don't allow deleting the current user
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    await deleteUser(userId);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}
