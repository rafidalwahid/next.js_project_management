import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { API_ERROR_CODES, ACTION_TYPES } from "@/lib/constants/attendance";

interface Params {
  params: {
    id: string;
  };
}

// Update the status of an attendance exception
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: API_ERROR_CODES.UNAUTHORIZED }
      );
    }
    
    // Only admins and managers can update exception status
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: API_ERROR_CODES.FORBIDDEN }
      );
    }
    
    // Get exception ID from URL params
    const { id } = params;
    
    // Get request body
    const body = await req.json();
    const { status } = body;
    
    // Validate status value
    if (!['new', 'acknowledged', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    // Check if the exception exists
    const exception = await prisma.attendanceException.findUnique({
      where: { id }
    });
    
    if (!exception) {
      return NextResponse.json(
        { error: "Exception not found" },
        { status: API_ERROR_CODES.NOT_FOUND }
      );
    }
    
    // Update the exception status
    const updatedException = await prisma.attendanceException.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        resolvedById: status === 'resolved' ? session.user.id : undefined,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
        acknowledgedById: status === 'acknowledged' ? session.user.id : undefined,
        acknowledgedAt: status === 'acknowledged' ? new Date() : undefined
      }
    });
    
    // Log the activity
    await prisma.activity.create({
      data: {
        action: ACTION_TYPES.EXCEPTION,
        entityType: 'attendance-exception',
        entityId: id,
        description: `Attendance exception status changed to ${status} by ${session.user.name || session.user.email}`,
        userId: session.user.id
      }
    });
    
    // Return the updated exception
    return NextResponse.json({
      message: `Exception status updated to ${status}`,
      exception: updatedException
    });
    
  } catch (error) {
    console.error("Error updating exception status:", error);
    return NextResponse.json(
      { error: "Failed to update exception status" },
      { status: API_ERROR_CODES.SERVER_ERROR }
    );
  }
}