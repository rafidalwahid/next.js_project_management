import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getDayBoundaries, isLateCheckIn, isWeekendDay } from '@/lib/utils/attendance-date-utils';

export async function GET(req: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user has admin or manager role
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Skip weekend days as they're not workdays by default
    const today = new Date();
    if (isWeekendDay(today)) {
      return NextResponse.json({ 
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        totalEmployees: 0,
        recentExceptions: [] 
      });
    }
    
    // Get today's date boundaries for queries
    const { start, end } = getDayBoundaries(today);
    
    // Get total employees (excluding admins)
    // Fixed: Removed the non-existent 'active' field
    const totalEmployees = await prisma.user.count({
      where: {
        role: {
          not: 'admin', // Exclude admins from attendance requirements
        },
      },
    });
    
    // Get attendance records for today in a single query
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        checkInTime: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });
    
    // Count unique users who have checked in today
    const presentUserIds = new Set(attendanceRecords.map(record => record.userId));
    const presentCount = presentUserIds.size;
    
    // Count late arrivals
    const lateCount = attendanceRecords.filter(record => 
      isLateCheckIn(record.checkInTime)
    ).length;
    
    // Calculate absent users (users who haven't checked in today)
    const absentCount = totalEmployees - presentCount;
    
    // Get recent attendance exceptions (limited to 5)
    const recentExceptions = await prisma.activity.findMany({
      where: {
        action: {
          in: ['attendance-exception', 'attendance-adjusted', 'auto-checkout'],
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
    
    // Return all metrics in a single response
    return NextResponse.json({
      presentCount,
      lateCount,
      absentCount,
      totalEmployees,
      recentExceptions
    });
  } catch (error) {
    console.error('Error fetching admin dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}