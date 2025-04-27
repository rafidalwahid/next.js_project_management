import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

interface Params {
  params: {
    userId: string;
  };
}

// GET /api/users/[userId]/attendance - Get attendance records for a specific user
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In Next.js App Router, params might be a promise that needs to be awaited
    const { userId } = await params;

    // Check if user has permission to view this user's attendance
    // Users can view their own attendance, admins can view any user's attendance
    const isOwnProfile = session.user.id === userId;
    const isAdmin = session.user.role === 'admin';
    const isManager = session.user.role === 'manager';
    
    if (!isOwnProfile && !isAdmin && !isManager) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this user\'s attendance' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build where clause
    const where: any = { userId };
    
    if (startDate) {
      where.checkInTime = {
        ...where.checkInTime,
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.checkInTime = {
        ...where.checkInTime,
        lte: new Date(endDate)
      };
    }

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: {
        checkInTime: 'desc'
      },
      skip,
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.attendance.count({ where });

    // Calculate summary statistics
    const allRecords = await prisma.attendance.findMany({
      where,
      select: {
        totalHours: true,
        checkInTime: true,
        checkOutTime: true
      }
    });

    const summary = {
      totalRecords: totalCount,
      totalHours: allRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0),
      averageHoursPerDay: 0,
      firstCheckIn: allRecords.length > 0 ? 
        allRecords.reduce((earliest, record) => 
          record.checkInTime < earliest ? record.checkInTime : earliest, 
          allRecords[0].checkInTime
        ) : null,
      lastCheckOut: allRecords.length > 0 ? 
        allRecords.reduce((latest, record) => 
          record.checkOutTime && record.checkOutTime > latest ? record.checkOutTime : latest, 
          new Date(0)
        ) : null
    };

    // Calculate average hours per day if there are records
    if (allRecords.length > 0) {
      // Get unique days
      const uniqueDays = new Set(
        allRecords.map(record => 
          new Date(record.checkInTime).toISOString().split('T')[0]
        )
      );
      
      summary.averageHoursPerDay = summary.totalHours / uniqueDays.size;
    }

    return NextResponse.json({
      attendanceRecords,
      summary,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching user attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user attendance', details: error.message },
      { status: 500 }
    );
  }
}
