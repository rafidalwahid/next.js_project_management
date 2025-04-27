import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

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
    if (checkInTime && checkOutTime) {
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);
      
      // Validate dates
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
      
      // Ensure check-out is after check-in
      if (checkOut <= checkIn) {
        return NextResponse.json(
          { error: "Check-out time must be after check-in time" },
          { status: 400 }
        );
      }
      
      // Calculate hours (limited to 24 hours per day)
      const hoursDiff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      totalHours = Math.min(hoursDiff, 24);
    }

    // Update the attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkInTime: checkInTime ? new Date(checkInTime) : attendance.checkInTime,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : attendance.checkOutTime,
        totalHours: parseFloat(totalHours.toFixed(2)),
        adjustedById: session.user.id,
        adjustmentReason,
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
