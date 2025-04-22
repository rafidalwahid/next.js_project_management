import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getLocationName } from "@/lib/geo-utils";

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
        { status: 404 }
      );
    }

    // Verify the attendance record belongs to the user
    if (attendance.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // If already checked out
    if (attendance.checkOutTime) {
      return NextResponse.json(
        { error: "Already checked out", attendance },
        { status: 400 }
      );
    }

    // Calculate total hours
    const checkInTime = new Date(attendance.checkInTime);
    const checkOutTime = new Date();
    const totalHoursDecimal = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    const totalHours = parseFloat(totalHoursDecimal.toFixed(2));

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
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: "checked-out",
        entityType: "attendance",
        entityId: attendance.id,
        description: `User checked out after ${totalHours} hours`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Check-out successful",
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Failed to check out" },
      { status: 500 }
    );
  }
}
