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
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: {
        checkInTime: 'desc',
      },
      skip,
      take: limit,
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

    // Get total count for pagination
    const totalCount = await prisma.attendance.count({ where });

    return NextResponse.json({
      attendanceRecords,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
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
