import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  format,
  differenceInBusinessDays,
  isSameDay
} from "date-fns";

// Constants - keep consistent with other attendance endpoints
const MAX_WORKING_HOURS_PER_DAY = 12;
const WORK_START_HOUR = 9; // 9:00 AM
const LATE_THRESHOLD_MINUTES = 15; // 15 minutes grace period

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
    
    // Calculate business days in the period (excluding weekends)
    const workingDays = differenceInBusinessDays(endDate, startDate) + 1;
    
    // Group records by user and day to handle multiple check-ins properly
    const userDayHoursMap = new Map();
    const userDayOnTimeMap = new Map();
    const userDayPresenceMap = new Map();
    
    attendanceRecords.forEach(record => {
      const userId = record.userId;
      const recordDate = new Date(record.checkInTime);
      const dateKey = format(recordDate, 'yyyy-MM-dd');
      const userDayKey = `${userId}-${dateKey}`;
      
      // Track total hours (with cap) per user per day
      if (record.totalHours) {
        const cappedHours = Math.min(record.totalHours, MAX_WORKING_HOURS_PER_DAY);
        
        if (!userDayHoursMap.has(userDayKey)) {
          userDayHoursMap.set(userDayKey, 0);
        }
        
        userDayHoursMap.set(userDayKey, userDayHoursMap.get(userDayKey) + cappedHours);
      }
      
      // Track user presence for this day
      userDayPresenceMap.set(userDayKey, true);
      
      // Track if user was on time for this day
      // Only use the earliest check-in for that user on that day
      if (!userDayOnTimeMap.has(userDayKey)) {
        const checkInHour = recordDate.getHours();
        const checkInMinutes = recordDate.getMinutes();
        
        const isOnTime = (
          checkInHour < WORK_START_HOUR || 
          (checkInHour === WORK_START_HOUR && checkInMinutes <= LATE_THRESHOLD_MINUTES)
        );
        
        userDayOnTimeMap.set(userDayKey, isOnTime);
      }
    });
    
    // Apply daily caps to total hours and calculate team-wide metrics
    let teamTotalHours = 0;
    Array.from(userDayHoursMap.entries()).forEach(([userDayKey, hours]) => {
      // Apply daily hour cap
      const cappedDayHours = Math.min(hours, MAX_WORKING_HOURS_PER_DAY);
      teamTotalHours += cappedDayHours;
    });
    
    // Calculate team-wide statistics
    const totalAttendanceDays = userDayPresenceMap.size;
    const totalOnTimeDays = Array.from(userDayOnTimeMap.values()).filter(Boolean).length;
    
    // Count unique active users (users with at least one attendance record)
    const activeUserIds = new Set(attendanceRecords.map(record => record.userId));
    const activeMembers = activeUserIds.size;
    
    // Calculate attendance rate: actual attendance days / potential working days
    const expectedAttendanceDays = userIds.length * workingDays; 
    const attendanceRate = expectedAttendanceDays > 0 
      ? (totalAttendanceDays / expectedAttendanceDays) * 100 
      : 0;
    
    // Calculate on-time rate: days on time / days present
    const onTimeRate = totalAttendanceDays > 0 
      ? (totalOnTimeDays / totalAttendanceDays) * 100 
      : 0;
    
    // Calculate daily stats
    const dailyMap = new Map();
    
    // Initialize with all days in range
    for (let i = 0; i < days; i++) {
      const day = subDays(endDate, i);
      const dayStr = format(day, "yyyy-MM-dd");
      dailyMap.set(dayStr, {
        date: dayStr,
        displayDate: format(day, "MMM dd"),
        totalHours: 0,
        attendanceCount: 0,
        onTimeCount: 0
      });
    }
    
    // Collect daily statistics
    Array.from(userDayPresenceMap.keys()).forEach(userDayKey => {
      const dateKey = userDayKey.split('-').slice(1).join('-');
      
      if (dailyMap.has(dateKey)) {
        const dayStats = dailyMap.get(dateKey);
        dayStats.attendanceCount += 1;
        
        if (userDayOnTimeMap.get(userDayKey)) {
          dayStats.onTimeCount += 1;
        }
        
        // Get capped hours for this user-day
        if (userDayHoursMap.has(userDayKey)) {
          dayStats.totalHours += Math.min(
            userDayHoursMap.get(userDayKey),
            MAX_WORKING_HOURS_PER_DAY
          );
        }
      }
    });
    
    const dailyStats = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate per-user stats
    const userStatsMap = new Map();
    
    // Initialize stats for all users
    userIds.forEach(userId => {
      userStatsMap.set(userId, {
        userId,
        name: "",
        email: "",
        image: null,
        totalHours: 0,
        attendanceDays: 0,
        onTimeDays: 0,
        lateDays: 0,
        attendanceRate: 0,
        onTimeRate: 0,
        days: new Set()
      });
    });
    
    // Process attendance records for per-user statistics
    attendanceRecords.forEach(record => {
      const stats = userStatsMap.get(record.userId);
      
      if (stats) {
        // Set user info
        stats.name = record.user.name || "";
        stats.email = record.user.email;
        stats.image = record.user.image;
        
        // Track unique days
        const dateKey = format(new Date(record.checkInTime), "yyyy-MM-dd");
        stats.days.add(dateKey);
      }
    });
    
    // Calculate per-user aggregated statistics 
    Array.from(userDayHoursMap.entries()).forEach(([userDayKey, hours]) => {
      const [userId, dateKey] = userDayKey.split('-');
      const stats = userStatsMap.get(userId);
      
      if (stats) {
        stats.totalHours += Math.min(hours, MAX_WORKING_HOURS_PER_DAY);
        
        // Count if this day was on time
        if (userDayOnTimeMap.get(userDayKey)) {
          stats.onTimeDays += 1;
        } else {
          stats.lateDays += 1;
        }
      }
    });
    
    // Finalize user statistics
    const userStats = Array.from(userStatsMap.values()).map(stats => {
      const attendanceDays = stats.days.size;
      
      // Clean up internal data structures
      const { days, ...cleanStats } = stats;
      
      return {
        ...cleanStats,
        attendanceDays,
        totalHours: parseFloat(stats.totalHours.toFixed(2)),
        averageHoursPerDay: attendanceDays > 0 
          ? parseFloat((stats.totalHours / attendanceDays).toFixed(2)) 
          : 0,
        attendanceRate: parseFloat(((attendanceDays / workingDays) * 100).toFixed(2)),
        onTimeRate: attendanceDays > 0 
          ? parseFloat(((stats.onTimeDays / attendanceDays) * 100).toFixed(2)) 
          : 0
      };
    }).sort((a, b) => b.totalHours - a.totalHours); // Sort by total hours (most to least)
    
    // Calculate team-wide average hours per day
    const averageHoursPerDay = activeMembers > 0 && workingDays > 0
      ? parseFloat((teamTotalHours / (activeMembers * workingDays)).toFixed(2))
      : 0;
    
    return NextResponse.json({
      analytics: {
        totalMembers: userIds.length,
        activeMembers,
        totalHours: parseFloat(teamTotalHours.toFixed(2)),
        averageHoursPerDay,
        workingDays,
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        onTimeRate: parseFloat(onTimeRate.toFixed(2)),
        dailyStats,
        userStats,
        period: {
          days,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd")
        }
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
