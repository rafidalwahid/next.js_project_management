import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

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
    const period = url.searchParams.get("period");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const limit = parseInt(url.searchParams.get("limit") || "30");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const groupBy = url.searchParams.get("groupBy"); // 'day', 'week', 'month'

    // Build the where clause
    const where: any = {
      userId: session.user.id,
    };

    // Handle period parameter
    if (period) {
      const now = new Date();
      let periodStartDate, periodEndDate;

      if (period === "week") {
        periodStartDate = startOfWeek(now);
        periodEndDate = endOfWeek(now);
      } else if (period === "month") {
        periodStartDate = startOfMonth(now);
        periodEndDate = endOfMonth(now);
      }

      if (periodStartDate && periodEndDate) {
        where.checkInTime = {
          gte: periodStartDate,
          lte: periodEndDate,
        };
      }
    } else {
      // Add date filters if provided and no period specified
      if (startDate) {
        where.checkInTime = {
          ...(where.checkInTime || {}),
          gte: new Date(startDate),
        };
      }

      if (endDate) {
        where.checkInTime = {
          ...(where.checkInTime || {}),
          lte: new Date(endDate),
        };
      }
    }

    // Get attendance records
    // When grouping, we need to get all records to ensure proper grouping
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: {
        checkInTime: 'desc',
      },
      // Only apply pagination when not grouping
      ...(groupBy ? {} : { skip, take: limit }),
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            description: true,
          }
        }
      }
    });

    // Store the original records for non-grouped view
    const paginatedRecords = groupBy
      ? attendanceRecords.slice(skip, skip + limit)
      : attendanceRecords;

    // Group records if requested
    let groupedRecords = null;
    if (groupBy) {

      // Debug the attendance records
      console.log('Total attendance records:', attendanceRecords.length);

      // Create a map to group records by day, week, or month
      const groupMap = new Map();

      // Print all record dates for debugging
      console.log('All record dates:');
      attendanceRecords.forEach(record => {
        console.log(`Record ID: ${record.id}, Date: ${new Date(record.checkInTime).toISOString()}`);
      });

      attendanceRecords.forEach(record => {
        try {
          let groupKey = '';
          const date = new Date(record.checkInTime);

          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.error('Invalid date:', record.checkInTime);
            return; // Skip this record
          }

          if (groupBy === 'day') {
            // Format: 2023-04-22
            groupKey = date.toISOString().split('T')[0];
            console.log(`Grouping record ${record.id} into day: ${groupKey}`);
          } else if (groupBy === 'week') {
            // Get the start and end of the week
            const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            // Format: 2023-04-17 to 2023-04-23
            groupKey = `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`;
            console.log(`Grouping record ${record.id} into week: ${groupKey}`);
          } else if (groupBy === 'month') {
            // Format: 2023-04 (Year-Month)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            groupKey = `${year}-${month}`;
            console.log(`Grouping record ${record.id} into month: ${groupKey}`);
          } else {
            // Default fallback
            groupKey = 'unknown';
          }

          // Add the record to the appropriate group
          if (!groupMap.has(groupKey)) {
            groupMap.set(groupKey, {
              period: groupKey,
              records: [],
              totalHours: 0,
              checkInCount: 0,
            });
          }

          const group = groupMap.get(groupKey);
          group.records.push(record);

          // Add hours, but ensure we don't exceed 24 hours per day
          // If this is a day grouping, limit total hours to 24
          if (groupBy === 'day') {
            group.totalHours = Math.min(group.totalHours + (record.totalHours || 0), 24);
          } else {
            // For week/month, we'll still add the hours but ensure each record doesn't exceed 24h
            group.totalHours += Math.min(record.totalHours || 0, 24);
          }

          group.checkInCount += 1;
        } catch (error) {
          console.error('Error processing record for grouping:', error, record);
          // Skip this record on error
        }
      });

      // Convert the map to an array
      groupedRecords = Array.from(groupMap.values());

      // Calculate additional stats for each group
      groupedRecords = groupedRecords.map(group => {
        // For day grouping, average is just the total (since it's one day)
        // For week/month, calculate based on unique days with records
        let averageHoursPerDay;

        if (groupBy === 'day') {
          averageHoursPerDay = group.totalHours;
        } else {
          // Count unique days in this group
          const uniqueDays = new Set(
            group.records.map(record =>
              new Date(record.checkInTime).toISOString().split('T')[0]
            )
          ).size;

          // Calculate average hours per day based on unique days
          averageHoursPerDay = uniqueDays > 0
            ? group.totalHours / uniqueDays
            : group.totalHours;
        }

        return {
          ...group,
          totalHours: parseFloat(group.totalHours.toFixed(2)),
          averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(2))
        };
      });

      // Sort by date (newest first)
      try {
        groupedRecords.sort((a, b) => {
          if (groupBy === 'month') {
            // For month grouping, compare the year-month strings directly
            return b.period.localeCompare(a.period);
          } else if (groupBy === 'week') {
            // For week grouping, compare the start dates
            const dateA = new Date(a.period.split(' ')[0]);
            const dateB = new Date(b.period.split(' ')[0]);

            // Check if dates are valid
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1; // Invalid dates go to the end
            if (isNaN(dateB.getTime())) return -1;

            return dateB.getTime() - dateA.getTime();
          } else {
            // For day grouping or any other, compare the full dates
            const dateA = new Date(a.period);
            const dateB = new Date(b.period);

            // Check if dates are valid
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1; // Invalid dates go to the end
            if (isNaN(dateB.getTime())) return -1;

            return dateB.getTime() - dateA.getTime();
          }
        });
      } catch (error) {
        console.error('Error sorting grouped records:', error);
        // Don't change the order if sorting fails
      }

      // Debug the grouped records
      console.log('Grouped records count:', groupedRecords.length);
      groupedRecords.forEach(group => {
        console.log(`Group ${group.period}: ${group.records.length} records`);
      });
    }

    // Get total count for pagination
    const totalCount = await prisma.attendance.count({ where });

    // Apply pagination to grouped records if needed
    const paginatedGroupedRecords = groupBy
      ? groupedRecords.slice(0, limit) // Just take the first 'limit' groups for now
      : [];

    return NextResponse.json({
      attendanceRecords: paginatedRecords,
      groupedRecords: groupBy ? paginatedGroupedRecords : [],
      totalGroups: groupBy ? groupedRecords.length : null,
      groupBy: groupBy || null,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      period,
      dateRange: {
        start: startDate,
        end: endDate,
      }
    });
  } catch (error) {
    console.error("Get attendance history error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve attendance history" },
      { status: 500 }
    );
  }
}
