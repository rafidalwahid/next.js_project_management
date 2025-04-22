import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "month"; // day, week, month, year

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case "week":
        // Start of current week (Sunday)
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
    }

    // Get attendance records for the period
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        checkInTime: {
          gte: startDate,
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    // Calculate statistics
    let totalHours = 0;
    let completedDays = 0;
    let onTimeCount = 0;
    
    // Define work start time (e.g., 9:00 AM)
    const workStartHour = 9;
    
    attendanceRecords.forEach(record => {
      // Count total hours
      if (record.totalHours) {
        totalHours += record.totalHours;
      } else if (record.checkOutTime) {
        const checkInTime = new Date(record.checkInTime);
        const checkOutTime = new Date(record.checkOutTime);
        const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
      
      // Count completed days (records with check-out)
      if (record.checkOutTime) {
        completedDays++;
        
        // Check if checked in on time
        const checkInTime = new Date(record.checkInTime);
        if (checkInTime.getHours() <= workStartHour) {
          onTimeCount++;
        }
      }
    });
    
    // Calculate average daily hours
    const averageHours = completedDays > 0 ? totalHours / completedDays : 0;
    
    // Calculate on-time percentage
    const onTimePercentage = completedDays > 0 ? (onTimeCount / completedDays) * 100 : 0;
    
    // Get total working days in the period (excluding weekends)
    const endDate = new Date();
    let totalWorkingDays = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) { // Skip weekends (0 = Sunday, 6 = Saturday)
        totalWorkingDays++;
      }
    }

    return NextResponse.json({ 
      stats: {
        period,
        totalHours: parseFloat(totalHours.toFixed(2)),
        averageHours: parseFloat(averageHours.toFixed(2)),
        attendanceDays: completedDays,
        totalWorkingDays,
        attendanceRate: totalWorkingDays > 0 ? parseFloat(((completedDays / totalWorkingDays) * 100).toFixed(2)) : 0,
        onTimeRate: parseFloat(onTimePercentage.toFixed(2)),
      }
    });
  } catch (error) {
    console.error("Get attendance stats error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve attendance statistics" },
      { status: 500 }
    );
  }
}
