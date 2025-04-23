import { NextRequest, NextResponse } from 'next/server';
import { updateUserImage, logUserActivity } from '@/lib/queries/user-queries';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';
import { v4 as uuidv4 } from 'uuid';

// PUT /api/users/[id]/image - Upload user profile image
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

    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create a unique filename with the correct extension
    const fileExtension = fileType.split('/')[1];
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Determine public directory path
    const publicDir = join(process.cwd(), 'public');
    const uploadDir = join(publicDir, 'uploads', 'profile');
    const filePath = join(uploadDir, fileName);

    // Ensure upload directory exists
    try {
      await access(uploadDir, constants.F_OK);
    } catch (error) {
      console.log('Creating upload directory:', uploadDir);
      await mkdir(uploadDir, { recursive: true });
    }

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('Writing file to:', filePath);
    // Write file to disk
    try {
      await writeFile(filePath, buffer);
      console.log('File written successfully');
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }

    // Get the URL path to the image (relative to public directory)
    const imageUrl = `/uploads/profile/${fileName}`;

    // Update user profile image in database
    const updatedUser = await updateUserImage(userId, imageUrl);

    // Log activity
    await logUserActivity(
      session.user.id,
      'updated',
      'profile',
      userId,
      'Updated profile image'
    );

    return NextResponse.json({
      success: true,
      image: imageUrl
    });
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile image', details: error.message },
      { status: 500 }
    );
  }
}