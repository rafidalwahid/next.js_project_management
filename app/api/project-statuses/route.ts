import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

// GET handler to list all project statuses
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all project statuses
    const statuses = await prisma.projectStatus.findMany({
      orderBy: [
        { isDefault: 'desc' }, // Default status first
        { name: 'asc' } // Then alphabetically
      ]
    });

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Error fetching project statuses:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching project statuses" },
      { status: 500 }
    );
  }
}
