import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// GET handler to list users (for assignment dropdown, etc.)
export async function GET(req: NextRequest) {
  try {
    // Temporarily comment this out for testing
    // const session = await getServerSession(authOptions);

    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Get search params
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build filter
    const where: any = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    // If projectId is provided, get team members from that project
    if (projectId) {
      const users = await prisma.teamMember.findMany({
        where: { projectId },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              createdAt: true,
            }
          }
        },
        take: limit,
      });

      return NextResponse.json({
        users: users.map(member => member.user)
      });
    }

    // Otherwise get all users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        // Don't include sensitive information
      },
      orderBy: {
        name: "asc"
      },
      take: limit,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching users", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}