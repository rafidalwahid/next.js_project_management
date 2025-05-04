import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getDayBoundaries, getLateThreshold } from '@/lib/utils/attendance-date-utils';

export async function GET() {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or manager
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        { error: "Forbidden: Admin or manager role required" },
        { status: 403 }
      );
    }

    // Get today's date boundaries for the query
    const today = new Date();
    const { start, end } = getDayBoundaries(today);
    const lateThreshold = getLateThreshold(today);

    // Count unique users who checked in late today
    const count = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: lateThreshold,
          lte: end,
        },
      },
      distinct: ['userId'], // Count each user only once
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching late count:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch late count' }), {
      status: 500
    });
  }
}