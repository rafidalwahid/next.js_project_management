import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

// GET handler to list projects
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const statusParam = url.searchParams.get('status');
    const statusIdParam = url.searchParams.get('statusId');

    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    let where: any = {};

    // Add status filter if provided
    if (statusIdParam) {
      where.statusId = statusIdParam;
    } else if (statusParam) {
      // For backward compatibility, try to find status by name
      const status = await prisma.projectStatus.findFirst({
        where: {
          name: {
            equals: statusParam,
            mode: 'insensitive'
          }
        }
      });

      if (status) {
        where.statusId = status.id;
      }
    }

    // Role-based filtering
    const userId = session.user.id;
    const userRole = session.user.role;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    try {
      // Get total count based on the filtered criteria
      const total = await prisma.project.count({ where });

      // Get projects with pagination
      const projects = await prisma.project.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          status: true,
          _count: {
            select: {
              tasks: true,
              teamMembers: true,
            }
          }
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: limit,
        skip: skip,
      });

      return NextResponse.json({
        projects: projects.map(project => ({
          ...project,
          startDate: project.startDate?.toISOString() || null,
          endDate: project.endDate?.toISOString() || null,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in projects API:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching projects" },
      { status: 500 }
    );
  }
}

// Validation schema for creating a project
const createProjectSchema = z.object({
  title: z.string()
    .min(3, "Project title must be at least 3 characters long")
    .max(100, "Project title cannot exceed 100 characters"),
  description: z.string().optional(),
  statusId: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// POST handler to create a project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        error: "Unauthorized - Please log in again",
        details: { session: false }
      }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Verify user exists before creating project
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database", details: { userId: session.user.id } },
        { status: 404 }
      );
    }

    // Get default status or use provided statusId
    let statusId = validationResult.data.statusId;

    if (!statusId) {
      // Find the default status
      const defaultStatus = await prisma.projectStatus.findFirst({
        where: { isDefault: true }
      });

      if (!defaultStatus) {
        // If no default status exists, get any status
        const anyStatus = await prisma.projectStatus.findFirst();

        if (!anyStatus) {
          return NextResponse.json(
            { error: "No project statuses found in the system" },
            { status: 500 }
          );
        }

        statusId = anyStatus.id;
      } else {
        statusId = defaultStatus.id;
      }
    }

    // Create project with user association
    const project = await prisma.project.create({
      data: {
        title: validationResult.data.title,
        description: validationResult.data.description,
        startDate: validationResult.data.startDate && validationResult.data.startDate.trim() !== "" 
          ? new Date(validationResult.data.startDate) 
          : null,
        endDate: validationResult.data.endDate && validationResult.data.endDate.trim() !== "" 
          ? new Date(validationResult.data.endDate) 
          : null,
        statusId: statusId,
        createdById: user.id,
        teamMembers: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the project", details: { error: String(error) } },
      { status: 500 }
    );
  }
}
