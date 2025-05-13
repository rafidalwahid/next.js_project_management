import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

/**
 * GET /api/debug-user
 * Debug endpoint to check user ID and database existence
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        error: 'No session found',
        authenticated: false,
      });
    }

    if (!session.user) {
      return NextResponse.json({
        error: 'Session has no user object',
        session,
        authenticated: true,
      });
    }

    if (!session.user.id) {
      return NextResponse.json({
        error: 'Session user has no ID',
        user: session.user,
        authenticated: true,
      });
    }

    const userId = session.user.id;

    // Check if user exists in database
    const userInDb = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    // Check if user has attendance settings
    const attendanceSettings = await prisma.attendanceSettings.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        workHoursPerDay: true,
        workDays: true,
      },
    });

    // Get all users in the database (for debugging)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 5, // Limit to 5 users for brevity
    });

    // Return the debug information
    return NextResponse.json({
      session: {
        user: session.user,
      },
      userExists: !!userInDb,
      userInDb,
      attendanceSettingsExist: !!attendanceSettings,
      attendanceSettings,
      sampleUsers: allUsers,
      totalUsers: await prisma.user.count(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
