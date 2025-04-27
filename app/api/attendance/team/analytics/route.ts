import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

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

    // Check if user has admin or manager role
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        { error: "You don't have permission to view team analytics" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const projectId = url.searchParams.get("projectId");
    
    // Calculate date range
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    // Build where clause for team members
    const teamWhere: any = {};
    if (projectId) {
      teamWhere.projectId = projectId;
    }
    
    // Get team members
    const teamMembers = projectId 
      ? await prisma.teamMember.findMany({
          where: teamWhere,
          select: { userId: true }
        })
      : await prisma.user.findMany({
          where: {
            NOT: { role: "admin" } // Exclude admins if no project specified
          },
          select: { id: true }
        });
    
    const userIds = projectId 
      ? teamMembers.map(member => member.userId)
      : teamMembers.map(user => user.id);
    
    if (userIds.length === 0) {
      return NextResponse.json({
        error: "No team members found",
        analytics: {
          totalMembers: 0,
          activeMembers: 0,
          totalHours: 0,
          averageHoursPerDay: 0,
          attendanceRate: 0,
          onTimeRate: 0,
          dailyStats: [],
          userStats: []
        }
      });
    }
    
    // Get attendance records for these users
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: { in: userIds },
        checkInTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    
    // Calculate team analytics
    const totalHours = attendanceRecords.reduce((sum, record) => 
      sum + (record.totalHours || 0), 0);
    
    // Count unique active users (users with at least one attendance record)
    const activeUserIds = new Set(attendanceRecords.map(record => record.userId));
    const activeMembers = activeUserIds.size;
    
    // Calculate attendance rate
    const workingDays = Math.min(days, 22); // Assume max 22 working days in a month
    const expectedAttendanceDays = userIds.length * workingDays;
    
    // Count unique user-day combinations
    const userDayCombinations = new Set();
    attendanceRecords.forEach(record => {
      const day = format(new Date(record.checkInTime), "yyyy-MM-dd");
      userDayCombinations.add(`${record.userId}-${day}`);
    });
    
    const attendanceRate = expectedAttendanceDays > 0 
      ? (userDayCombinations.size / expectedAttendanceDays) * 100 
      : 0;
    
    // Calculate on-time rate (assuming 9 AM is the start time)
    const workStartHour = 9;
    let onTimeCount = 0;
    
    attendanceRecords.forEach(record => {
      const checkInTime = new Date(record.checkInTime);
      if (checkInTime.getHours() < workStartHour || 
          (checkInTime.getHours() === workStartHour && checkInTime.getMinutes() <= 15)) {
        onTimeCount++;
      }
    });
    
    const onTimeRate = attendanceRecords.length > 0 
      ? (onTimeCount / attendanceRecords.length) * 100 
      : 0;
    
    // Calculate daily stats
    const dailyMap = new Map();
    
    for (let i = 0; i < days; i++) {
      const day = subDays(endDate, i);
      const dayStr = format(day, "yyyy-MM-dd");
      dailyMap.set(dayStr, {
        date: dayStr,
        totalHours: 0,
        attendanceCount: 0,
        onTimeCount: 0
      });
    }
    
    attendanceRecords.forEach(record => {
      const day = format(new Date(record.checkInTime), "yyyy-MM-dd");
      if (dailyMap.has(day)) {
        const stats = dailyMap.get(day);
        stats.totalHours += record.totalHours || 0;
        stats.attendanceCount += 1;
        
        const checkInTime = new Date(record.checkInTime);
        if (checkInTime.getHours() < workStartHour || 
            (checkInTime.getHours() === workStartHour && checkInTime.getMinutes() <= 15)) {
          stats.onTimeCount += 1;
        }
      }
    });
    
    const dailyStats = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate per-user stats
    const userStatsMap = new Map();
    
    userIds.forEach(userId => {
      userStatsMap.set(userId, {
        userId,
        name: "",
        email: "",
        image: null,
        totalHours: 0,
        attendanceDays: 0,
        onTimeCount: 0,
        averageHoursPerDay: 0,
        attendanceRate: 0,
        onTimeRate: 0
      });
    });
    
    attendanceRecords.forEach(record => {
      const stats = userStatsMap.get(record.userId);
      if (stats) {
        stats.name = record.user.name || "";
        stats.email = record.user.email;
        stats.image = record.user.image;
        stats.totalHours += record.totalHours || 0;
        
        // Count unique days
        const day = format(new Date(record.checkInTime), "yyyy-MM-dd");
        if (!stats.days) stats.days = new Set();
        stats.days.add(day);
        
        const checkInTime = new Date(record.checkInTime);
        if (checkInTime.getHours() < workStartHour || 
            (checkInTime.getHours() === workStartHour && checkInTime.getMinutes() <= 15)) {
          stats.onTimeCount += 1;
        }
      }
    });
    
    // Calculate derived stats for each user
    const userStats = Array.from(userStatsMap.values()).map(stats => {
      const attendanceDays = stats.days ? stats.days.size : 0;
      const recordCount = attendanceRecords.filter(r => r.userId === stats.userId).length;
      
      return {
        userId: stats.userId,
        name: stats.name,
        email: stats.email,
        image: stats.image,
        totalHours: parseFloat(stats.totalHours.toFixed(2)),
        attendanceDays,
        averageHoursPerDay: attendanceDays > 0 
          ? parseFloat((stats.totalHours / attendanceDays).toFixed(2)) 
          : 0,
        attendanceRate: parseFloat(((attendanceDays / workingDays) * 100).toFixed(2)),
        onTimeCount: stats.onTimeCount,
        onTimeRate: recordCount > 0 
          ? parseFloat(((stats.onTimeCount / recordCount) * 100).toFixed(2)) 
          : 0
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
    
    return NextResponse.json({
      analytics: {
        totalMembers: userIds.length,
        activeMembers,
        totalHours: parseFloat(totalHours.toFixed(2)),
        averageHoursPerDay: activeMembers > 0 
          ? parseFloat((totalHours / (activeMembers * workingDays)).toFixed(2)) 
          : 0,
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        onTimeRate: parseFloat(onTimeRate.toFixed(2)),
        dailyStats,
        userStats
      }
    });
  } catch (error: any) {
    console.error("Error fetching team analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch team analytics", details: error.message },
      { status: 500 }
    );
  }
}
