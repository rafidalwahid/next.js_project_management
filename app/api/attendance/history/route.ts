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

    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const limit = parseInt(url.searchParams.get("limit") || "30");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = {
      userId: session.user.id,
    };

    // Add date filters if provided
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

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: {
        checkInTime: 'desc',
      },
      skip,
      take: limit,
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
