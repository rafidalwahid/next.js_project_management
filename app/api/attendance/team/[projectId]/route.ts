import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

interface Params {
  params: {
    projectId: string;
  };
}

// GET /api/attendance/team/:projectId
// Get attendance records for all team members of a specific project
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = params;

    // Check if user has permission to view team attendance
    // Only admins, managers, and project creators can view team attendance
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      // Check if user is the project creator
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdById: true }
      });

      if (!project || project.createdById !== session.user.id) {
        return NextResponse.json(
          { error: "You don't have permission to view team attendance" },
          { status: 403 }
        );
      }
    }

    // Get URL parameters for filtering
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');

    // Get team members for the project
    const teamMembers = await prisma.teamMember.findMany({
      where: { projectId },
      select: { userId: true }
    });

    const userIds = teamMembers.map(member => member.userId);

    // Build where clause for attendance records
    const where: any = {
      userId: userId ? { equals: userId } : { in: userIds }
    };

    // Add date filters if provided
    if (startDate) {
      where.checkInTime = {
        ...where.checkInTime,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      where.checkInTime = {
        ...where.checkInTime,
        lte: new Date(endDate)
      };
    }

    // Get attendance records for these users
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: { checkInTime: 'desc' }
    });

    // Calculate summary statistics
    const summary = {
      totalRecords: attendanceRecords.length,
      totalHours: attendanceRecords.reduce((sum, record) => 
        sum + (record.totalHours || 0), 0),
      userCount: new Set(attendanceRecords.map(record => record.userId)).size
    };

    return NextResponse.json({ 
      attendanceRecords,
      summary
    });
  } catch (error) {
    console.error("Error fetching team attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch team attendance", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
