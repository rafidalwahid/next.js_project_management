import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getLocationName } from "@/lib/geo-utils";
import { differenceInHours, isAfter, isSameDay, startOfDay, endOfDay } from "date-fns";
import { WORK_DAY, API_ERROR_CODES, ACTION_TYPES } from "@/lib/constants/attendance";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: API_ERROR_CODES.UNAUTHORIZED }
      );
    }

    // Parse request body
    const body = await req.json();
    const { latitude, longitude, attendanceId, notes } = body;

    // Find the active attendance record
    const attendance = attendanceId
      ? await prisma.attendance.findUnique({ where: { id: attendanceId } })
      : await prisma.attendance.findFirst({
          where: {
            userId: session.user.id,
            checkOutTime: null,
          },
          orderBy: {
            checkInTime: 'desc',
          },
        });

    if (!attendance) {
      return NextResponse.json(
        { error: "No active check-in found" },
        { status: API_ERROR_CODES.NOT_FOUND }
      );
    }

    // Verify the attendance record belongs to the user
    if (attendance.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: API_ERROR_CODES.FORBIDDEN }
      );
    }

    // If already checked out
    if (attendance.checkOutTime) {
      return NextResponse.json(
        { error: "Already checked out", attendance },
        { status: API_ERROR_CODES.ALREADY_CHECKED_OUT }
      );
    }

    // Calculate check-out time
    const checkInTime = new Date(attendance.checkInTime);
    const now = new Date();
    
    // Check if check-in time is today
    const isSameDayCheckIn = isSameDay(checkInTime, now);
    
    // Determine appropriate check-out time
    let checkOutTime = now;
    
    // If checking out for a past date (not today), cap at end of the day of check-in
    // or use default working hours
    if (!isSameDayCheckIn) {
      // Calculate a reasonable check-out time (either default hours or end of day)
      const defaultCheckOut = new Date(checkInTime);
      defaultCheckOut.setHours(defaultCheckOut.getHours() + WORK_DAY.DEFAULT_CHECKOUT_HOURS);
      
      // Use end of day if default checkout would exceed it
      const endOfCheckInDay = endOfDay(checkInTime);
      checkOutTime = isAfter(defaultCheckOut, endOfCheckInDay) ? endOfCheckInDay : defaultCheckOut;
    }

    // Calculate total hours
    const hoursDiff = differenceInHours(checkOutTime, checkInTime);
    const minutesDiff = (checkOutTime.getTime() - checkInTime.getTime()) % (1000 * 60 * 60) / (1000 * 60);
    const totalHoursDecimal = hoursDiff + (minutesDiff / 60);

    // Limit to maximum working hours per day to prevent unrealistic values
    const limitedHours = Math.min(totalHoursDecimal, WORK_DAY.MAX_HOURS_PER_DAY);
    const totalHours = parseFloat(limitedHours.toFixed(2));

    // Get location name if coordinates are provided
    let locationName = null;
    if (latitude && longitude) {
      try {
        locationName = await getLocationName(latitude, longitude);
      } catch (error) {
        console.error("Error getting location name:", error);
      }
    }

    // Update attendance record with check-out information
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        checkOutLatitude: latitude || null,
        checkOutLongitude: longitude || null,
        checkOutLocationName: locationName,
        checkOutIpAddress: req.headers.get("x-forwarded-for") || req.ip || null,
        checkOutDeviceInfo: req.headers.get("user-agent") || null,
        totalHours,
        notes: notes || attendance.notes, // Update notes if provided
        autoCheckout: !isSameDayCheckIn, // Flag if this was an automatic checkout for a past date
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: isSameDayCheckIn ? ACTION_TYPES.CHECK_OUT : ACTION_TYPES.AUTO_CHECKOUT,
        entityType: "attendance",
        entityId: attendance.id,
        description: isSameDayCheckIn 
          ? `User checked out after ${totalHours} hours`
          : `System applied automatic checkout (${totalHours} hours) for past check-in`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Check-out successful",
      attendance: updatedAttendance,
      wasAutoCheckout: !isSameDayCheckIn
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Failed to check out" },
      { status: API_ERROR_CODES.SERVER_ERROR }
    );
  }
}
