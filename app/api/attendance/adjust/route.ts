import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { isSameDay, differenceInHours, isAfter, isBefore } from "date-fns";

// Constants - keep consistent with other attendance endpoints
const MAX_WORKING_HOURS_PER_DAY = 12;

export async function POST(req: NextRequest) {
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
        { error: "You don't have permission to adjust attendance records" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { 
      attendanceId, 
      checkInTime, 
      checkOutTime, 
      adjustmentReason,
      userId
    } = body;

    // Validate required fields
    if (!attendanceId || !adjustmentReason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Calculate total hours if both check-in and check-out times are provided
    let totalHours = attendance.totalHours;
    let newCheckInTime = checkInTime ? new Date(checkInTime) : new Date(attendance.checkInTime);
    let newCheckOutTime = checkOutTime ? new Date(checkOutTime) : (attendance.checkOutTime ? new Date(attendance.checkOutTime) : null);

    // Validate dates
    if (isNaN(newCheckInTime.getTime()) || (newCheckOutTime && isNaN(newCheckOutTime.getTime()))) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }
    
    // If check-out time is provided, ensure it's after check-in
    if (newCheckOutTime) {
      if (isBefore(newCheckOutTime, newCheckInTime)) {
        return NextResponse.json(
          { error: "Check-out time must be after check-in time" },
          { status: 400 }
        );
      }
      
      // Calculate hours with more precision
      const hoursDiff = differenceInHours(newCheckOutTime, newCheckInTime);
      const minutesDiff = (newCheckOutTime.getTime() - newCheckInTime.getTime()) % (1000 * 60 * 60) / (1000 * 60);
      const calculatedHours = hoursDiff + (minutesDiff / 60);
      
      // Check if records span across multiple days
      if (!isSameDay(newCheckInTime, newCheckOutTime)) {
        return NextResponse.json(
          { error: "Check-in and check-out must be on the same day" },
          { status: 400 }
        );
      }
      
      // Apply consistent limits on working hours
      totalHours = Math.min(calculatedHours, MAX_WORKING_HOURS_PER_DAY);
    } else {
      // If no check-out time, set total hours to null
      totalHours = null;
    }

    // Update the attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkInTime: newCheckInTime,
        checkOutTime: newCheckOutTime,
        totalHours: totalHours !== null ? parseFloat(totalHours.toFixed(2)) : null,
        adjustedById: session.user.id,
        adjustmentReason,
        autoCheckout: false, // Reset auto-checkout flag since this is a manual adjustment
      },
    });

    // Log the adjustment in the activity log
    await prisma.activity.create({
      data: {
        action: "attendance-adjusted",
        entityType: "attendance",
        entityId: attendance.id,
        description: `Attendance record for ${attendance.user.name || attendance.user.email} was adjusted by ${session.user.name || session.user.email}. Reason: ${adjustmentReason}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Attendance record adjusted successfully",
      attendance: updatedAttendance,
    });
  } catch (error: any) {
    console.error("Error adjusting attendance record:", error);
    return NextResponse.json(
      { error: "Failed to adjust attendance record", details: error.message },
      { status: 500 }
    );
  }
}
