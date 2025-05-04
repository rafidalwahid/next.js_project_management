import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getDayBoundaries, isWeekendDay } from '@/lib/utils/attendance-date-utils';

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

    // Skip weekend days as they're not workdays by default
    const today = new Date();
    if (isWeekendDay(today)) {
      return NextResponse.json({ count: 0 });
    }

    // Get today's date boundaries for the query
    const { start, end } = getDayBoundaries(today);

    // First, get total active employees
    const totalEmployees = await prisma.user.count({
      where: {
        active: true,
        role: {
          not: 'admin', // Exclude admins from attendance requirements
        },
      },
    });

    // Then, count users who have checked in today
    const attendanceCount = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: start,
          lte: end,
        },
      },
      distinct: ['userId'], // Count each user only once
    });

    // Absent = Total employees - Those who checked in
    const absentCount = Math.max(0, totalEmployees - attendanceCount);

    return NextResponse.json({ count: absentCount });
  } catch (error) {
    console.error('Error fetching absent count:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch absent count' }), {
      status: 500
    });
  }
}