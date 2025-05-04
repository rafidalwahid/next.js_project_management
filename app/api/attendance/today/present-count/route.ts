import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getDayBoundaries } from '@/lib/utils/attendance-date-utils';

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

    // Count unique users who have checked in today (regardless of checkout status)
    const count = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: start,
          lte: end,
        },
      },
      distinct: ['userId'], // Count each user only once
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching present count:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch present count' }), {
      status: 500
    });
  }
}