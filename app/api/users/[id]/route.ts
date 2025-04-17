import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

// Define validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  image: z.string().url("Invalid image URL").optional().nullable(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  jobTitle: z.string().max(100, "Job title must be less than 100 characters").optional().nullable(),
  department: z.string().max(100, "Department must be less than 100 characters").optional().nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
  phone: z.string().max(20, "Phone must be less than 20 characters").optional().nullable(),
  skills: z.array(z.string()).optional(),
  socialLinks: z.object({
    twitter: z.string().url("Invalid Twitter URL").optional().nullable(),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().nullable(),
    github: z.string().url("Invalid GitHub URL").optional().nullable(),
    website: z.string().url("Invalid website URL").optional().nullable(),
  }).optional(),
});

// Define the context type for the route parameters
interface RouteContext {
  params: {
    id: string;
  };
}

// GET handler to get a user by ID
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    // Debug session information
    console.log('Session:', session ? 'exists' : 'null');

    if (!session || !session.user) {
      console.error('No session or user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = context.params.id;

    // Check if the user is requesting their own profile or has admin rights
    const isOwnProfile = session.user.id === id;
    const isAdmin = session.user.role === "admin";

    // For debugging
    console.log('Session user ID:', session.user.id);
    console.log('Requested profile ID:', id);
    console.log('Is own profile:', isOwnProfile);
    console.log('Is admin:', isAdmin);

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user with related data
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Include any additional profile fields we might add later
          // These would need to be added to the Prisma schema
        }
      });

      if (!user) {
        console.error(`User with ID ${id} not found`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get user's projects
      const projects = await prisma.teamMember.findMany({
        where: { userId: id },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
              endDate: true,
            }
          }
        },
        orderBy: {
          joinedAt: 'desc'
        },
        take: 5,
      });

      // Get user's tasks
      const tasks = await prisma.task.findMany({
        where: { assignedToId: id },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              title: true,
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        },
        take: 5,
      });

      // Get task counts for stats
      const taskCount = await prisma.task.count({
        where: { assignedToId: id },
      });

      const completedTaskCount = await prisma.task.count({
        where: {
          assignedToId: id,
          status: 'completed'
        },
      });

      // Calculate completion rate
      const completionRate = taskCount > 0
        ? Math.round((completedTaskCount / taskCount) * 100) + '%'
        : '0%';

      // Get user's recent activities
      const activities = await prisma.activity.findMany({
        where: { userId: id },
        select: {
          id: true,
          action: true,
          entityType: true,
          description: true,
          createdAt: true,
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
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
      });

      // Get team count - count unique projects the user is a member of
      let teamCount = 0;
      try {
        // First try with raw query
        const result: any = await prisma.$queryRaw`
          SELECT COUNT(DISTINCT projectId) as count
          FROM TeamMember
          WHERE userId = ${id}
        `;
        teamCount = Number(result[0]?.count || 0);
      } catch (error) {
        console.error('Error counting team memberships with raw query:', error);
        try {
          // Fallback: Get all team memberships and count unique project IDs in JS
          const teamMemberships = await prisma.teamMember.findMany({
            where: { userId: id },
            select: { projectId: true },
          });
          const uniqueProjectIds = new Set(teamMemberships.map(tm => tm.projectId));
          teamCount = uniqueProjectIds.size;
        } catch (fallbackError) {
          console.error('Error counting team memberships with fallback:', fallbackError);
          // Continue with teamCount as 0
        }
      }

      return NextResponse.json({
        user,
        projects: projects.map(p => ({
          id: p.project.id,
          title: p.project.title,
          status: p.project.status,
          startDate: p.project.startDate,
          endDate: p.project.endDate,
          role: p.role,
          joinedAt: p.joinedAt,
        })),
        tasks,
        activities,
        stats: {
          projectCount: projects.length,
          taskCount,
          teamCount,
          completionRate,
        }
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the user" },
      { status: 500 }
    );
  }
}

// PATCH handler to update a user profile
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = context.params.id;

    // Check if the user is updating their own profile or has admin rights
    const isOwnProfile = session.user.id === id;
    const isAdmin = session.user.role === "admin";

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate request body
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validationResult.data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        updatedAt: true,
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: "updated",
        entityType: "profile",
        entityId: id,
        description: "Updated profile information",
        userId: session.user.id,
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the profile" },
      { status: 500 }
    );
  }
}
