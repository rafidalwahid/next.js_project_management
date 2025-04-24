import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";

// Validation schema for creating a project status
const createStatusSchema = z.object({
  name: z.string().min(1, "Status name is required").max(50, "Status name cannot exceed 50 characters"),
  color: z.string().min(1, "Color is required"),
  description: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

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

// POST handler to create a new project status
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Any authenticated user can create statuses
    // We removed the admin-only restriction to allow all users to create custom statuses

    const body = await req.json();

    // Validate request body
    const validationResult = createStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, color, description, isDefault } = validationResult.data;

    // Check if a status with the same name already exists (case-insensitive)
    const existingStatus = await prisma.projectStatus.findFirst({
      where: {
        name: {
          equals: name
        }
      }
    });

    if (existingStatus) {
      return NextResponse.json(
        { error: `A status with the name "${name}" already exists` },
        { status: 400 }
      );
    }

    // If this is set as default, unset any existing default
    if (isDefault) {
      await prisma.projectStatus.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create the new status
    const status = await prisma.projectStatus.create({
      data: {
        name,
        color,
        description,
        isDefault: isDefault || false
      }
    });

    return NextResponse.json({ status });
  } catch (error) {
    console.error("Error creating project status:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the project status" },
      { status: 500 }
    );
  }
}
