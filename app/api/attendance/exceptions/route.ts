import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { 
  WORK_DAY, 
  THRESHOLDS,
  EXCEPTION_TYPES, 
  DATE_FORMATS 
} from "@/lib/constants/attendance";
import { 
  formatDate, 
  getDayBoundaries, 
  safeParseISO, 
  isLateCheckIn 
} from "@/lib/utils/attendance-date-utils";

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
        { error: "You don't have permission to view attendance exceptions" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const exceptionType = url.searchParams.get("type"); // Get the exception type filter

    // Build date filters
    const dateFilter: any = {};
    
    if (startDate) {
      const parsedStartDate = safeParseISO(startDate);
      dateFilter.gte = getDayBoundaries(parsedStartDate).start;
    }
    
    if (endDate) {
      const parsedEndDate = safeParseISO(endDate);
      dateFilter.lte = getDayBoundaries(parsedEndDate).end;
    }

    // 1. Find users who were absent (no attendance records on workdays)
    const workingUsers = await prisma.user.findMany({
      where: {
        NOT: { role: "admin" }, // Exclude admins from attendance checks
        active: true, // Only include active users
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        department: true
      }
    });

    const userIds = workingUsers.map(user => user.id);
    
    // Get attendance records for the period
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: { in: userIds },
        checkInTime: dateFilter
      },
      select: {
        userId: true,
        checkInTime: true,
        checkOutTime: true,
        autoCheckout: true
      }
    });

    // Create map of user attendance dates
    const userAttendanceDates = new Map();
    attendanceRecords.forEach(record => {
      const userId = record.userId;
      const date = formatDate(record.checkInTime, DATE_FORMATS.API_DATE);
      
      if (!userAttendanceDates.has(userId)) {
        userAttendanceDates.set(userId, new Set());
      }
      
      userAttendanceDates.get(userId).add(date);
    });

    // Determine the unique dates in the range
    const uniqueDates = new Set<string>();
    
    // Just use the actual dates in the attendance records for simplicity
    attendanceRecords.forEach(record => {
      uniqueDates.add(formatDate(record.checkInTime, DATE_FORMATS.API_DATE));
    });

    const uniqueDatesArray = Array.from(uniqueDates);
    const today = formatDate(new Date(), DATE_FORMATS.API_DATE);

    // Track exceptions
    const exceptions: any[] = [];

    // Find absent users (missing attendance on specific dates)
    if (uniqueDatesArray.length > 0 && (!exceptionType || exceptionType === EXCEPTION_TYPES.ABSENT)) {
      workingUsers.forEach(user => {
        const userDates = userAttendanceDates.get(user.id) || new Set();
        
        uniqueDatesArray.forEach(date => {
          // Skip weekends and only process past dates (not today or future)
          const dateObj = new Date(date);
          const dayOfWeek = dateObj.getDay();
          const isWeekend = WORK_DAY.WEEKEND_DAYS.includes(dayOfWeek);
          const isPastDate = date < today;
          
          if (!isWeekend && isPastDate && !userDates.has(date)) {
            exceptions.push({
              id: `absent-${user.id}-${date}`,
              userId: user.id,
              userName: user.name || "",
              userEmail: user.email,
              userImage: user.image,
              department: user.department || "Unassigned",
              date,
              type: EXCEPTION_TYPES.ABSENT,
              details: `Absent without notice on ${formatDate(dateObj, 'EEEE, MMMM d')}`
            });
          }
        });
      });
    }

    // 2. Find users who were late
    if (!exceptionType || exceptionType === EXCEPTION_TYPES.LATE) {
      attendanceRecords.forEach(record => {
        if (isLateCheckIn(record.checkInTime)) {
          const checkInTime = new Date(record.checkInTime);
          const recordDate = formatDate(checkInTime, DATE_FORMATS.API_DATE);
          const user = workingUsers.find(u => u.id === record.userId);
          
          const checkInHour = checkInTime.getHours();
          const checkInMinute = checkInTime.getMinutes();
          const workStartHour = WORK_DAY.START_HOUR;
          
          exceptions.push({
            id: `late-${record.userId}-${recordDate}`,
            userId: record.userId,
            userName: user?.name || "",
            userEmail: user?.email || "",
            userImage: user?.image || null,
            department: user?.department || "Unassigned",
            date: recordDate,
            type: EXCEPTION_TYPES.LATE,
            details: `Late arrival at ${formatDate(checkInTime, DATE_FORMATS.DISPLAY_TIME)} (${checkInHour - workStartHour > 0 ? 
              `${checkInHour - workStartHour}h ` : ''}${checkInMinute > 0 ? `${checkInMinute}m ` : ''}late)`
          });
        }
      });
    }

    // 3. Find users who forgot to check out (auto-checkout triggered)
    if (!exceptionType || exceptionType === EXCEPTION_TYPES.FORGOT_CHECKOUT) {
      attendanceRecords.forEach(record => {
        if (record.autoCheckout) {
          const checkInTime = new Date(record.checkInTime);
          const recordDate = formatDate(checkInTime, DATE_FORMATS.API_DATE);
          const user = workingUsers.find(u => u.id === record.userId);
          
          exceptions.push({
            id: `forgot-${record.userId}-${recordDate}`,
            userId: record.userId,
            userName: user?.name || "",
            userEmail: user?.email || "",
            userImage: user?.image || null,
            department: user?.department || "Unassigned",
            date: recordDate,
            type: EXCEPTION_TYPES.FORGOT_CHECKOUT,
            details: `Forgot to check out after checking in at ${formatDate(checkInTime, DATE_FORMATS.DISPLAY_TIME)}`
          });
        }
      });
    }

    // 4. Find patterns of lateness (3 or more late arrivals)
    if (!exceptionType || exceptionType === EXCEPTION_TYPES.PATTERN) {
      // We still need to calculate patterns even if we're not displaying LATE exceptions
      const lateExceptions = [];
      
      if (exceptionType === EXCEPTION_TYPES.PATTERN) {
        // We need to find late exceptions first to calculate patterns
        attendanceRecords.forEach(record => {
          if (isLateCheckIn(record.checkInTime)) {
            const checkInTime = new Date(record.checkInTime);
            const recordDate = formatDate(checkInTime, DATE_FORMATS.API_DATE);
            
            lateExceptions.push({
              userId: record.userId,
              date: recordDate,
              type: EXCEPTION_TYPES.LATE
            });
          }
        });
      } else {
        // If we've already calculated late exceptions, use those
        lateExceptions.push(...exceptions.filter(e => e.type === EXCEPTION_TYPES.LATE));
      }
      
      const lateCountByUser = new Map<string, number>();
      
      lateExceptions.forEach(exception => {
        lateCountByUser.set(exception.userId, (lateCountByUser.get(exception.userId) || 0) + 1);
      });
      
      lateCountByUser.forEach((count, userId) => {
        if (count >= THRESHOLDS.PATTERN_COUNT) {
          const user = workingUsers.find(u => u.id === userId);
          
          exceptions.push({
            id: `pattern-${userId}`,
            userId,
            userName: user?.name || "",
            userEmail: user?.email || "",
            userImage: user?.image || null,
            department: user?.department || "Unassigned",
            date: formatDate(new Date(), DATE_FORMATS.API_DATE),
            type: EXCEPTION_TYPES.PATTERN,
            details: `Pattern of tardiness detected: Late ${count} times in the selected period`
          });
        }
      });
    }

    // Calculate counts for all exception types for the summary display
    const counts = {
      [EXCEPTION_TYPES.ABSENT]: 0,
      [EXCEPTION_TYPES.LATE]: 0,
      [EXCEPTION_TYPES.FORGOT_CHECKOUT]: 0,
      [EXCEPTION_TYPES.PATTERN]: 0
    };

    // If we're filtering by type, we need to calculate all counts separately
    if (exceptionType) {
      // For absent count
      if (uniqueDatesArray.length > 0) {
        workingUsers.forEach(user => {
          const userDates = userAttendanceDates.get(user.id) || new Set();
          
          uniqueDatesArray.forEach(date => {
            const dateObj = new Date(date);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = WORK_DAY.WEEKEND_DAYS.includes(dayOfWeek);
            const isPastDate = date < today;
            
            if (!isWeekend && isPastDate && !userDates.has(date)) {
              counts[EXCEPTION_TYPES.ABSENT]++;
            }
          });
        });
      }

      // For late count
      attendanceRecords.forEach(record => {
        if (isLateCheckIn(record.checkInTime)) {
          counts[EXCEPTION_TYPES.LATE]++;
        }
      });

      // For forgot checkout count
      attendanceRecords.forEach(record => {
        if (record.autoCheckout) {
          counts[EXCEPTION_TYPES.FORGOT_CHECKOUT]++;
        }
      });

      // Pattern count is calculated from the late occurrences
      const lateCountByUser = new Map<string, number>();
      
      attendanceRecords.forEach(record => {
        if (isLateCheckIn(record.checkInTime)) {
          lateCountByUser.set(record.userId, (lateCountByUser.get(record.userId) || 0) + 1);
        }
      });
      
      lateCountByUser.forEach((count, userId) => {
        if (count >= THRESHOLDS.PATTERN_COUNT) {
          counts[EXCEPTION_TYPES.PATTERN]++;
        }
      });
    } else {
      // If we're not filtering, we can just count the exceptions we've already found
      exceptions.forEach(exception => {
        counts[exception.type]++;
      });
    }

    return NextResponse.json({ 
      exceptions,
      counts
    });
  } catch (error: any) {
    console.error("Error fetching attendance exceptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance exceptions", details: error.message },
      { status: 500 }
    );
  }
}