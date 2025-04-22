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

    // Get the current date (start of day and end of day)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Find the most recent attendance record for today
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        checkInTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    // If no attendance record found for today
    if (!attendance) {
      // Get the most recent attendance record (even if not today)
      const lastAttendance = await prisma.attendance.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          checkInTime: 'desc',
        },
      });

      return NextResponse.json({ 
        message: "No attendance record found for today", 
        attendance: lastAttendance 
      });
    }

    return NextResponse.json({ 
      message: "Current attendance record retrieved", 
      attendance 
    });
  } catch (error) {
    console.error("Get current attendance error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve attendance information" },
      { status: 500 }
    );
  }
}
