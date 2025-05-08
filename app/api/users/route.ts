import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUsers, createUser } from '@/lib/queries/user-queries';
import { PermissionService } from "@/lib/permissions/unified-permission-service";

// GET /api/users - Get all users with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('take') ? parseInt(searchParams.get('take')!) : 10;
    const skip = searchParams.get('skip')
      ? parseInt(searchParams.get('skip')!)
      : (page - 1) * limit;
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const direction = searchParams.get('direction') || 'desc';
    const includeProjects = searchParams.get('includeProjects') === 'true';
    const includeTasks = searchParams.get('includeTasks') === 'true';
    const includeTeams = searchParams.get('includeTeams') === 'true';
    const includeCounts = searchParams.get('includeCounts') === 'true';
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const projectId = searchParams.get('projectId');

    // Build the where clause
    const where: any = {};

    // For regular users, only return team members they work with
    // Get user role and check permissions
    const userRole = session.user.role;
    const hasTeamViewPermission = await PermissionService.hasPermission(userRole, "team_view");

    // If user has team_view permission, they can see all users
    // If not and no specific project is requested, limit to users in the same projects
    if (!hasTeamViewPermission && !projectId) {
      console.log(`User ${session.user.id} does not have team_view permission. Limiting to project members.`);

      // Get projects the user is part of
      const userProjects = await prisma.teamMember.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          projectId: true,
        },
      });

      const userProjectIds = userProjects.map(p => p.projectId);

      // Only show users who are in the same projects
      where.teams = {
        some: {
          projectId: {
            in: userProjectIds,
          },
        },
      };
    } else if (hasTeamViewPermission) {
      console.log(`User ${session.user.id} has TEAM_VIEW permission. Showing all users.`);
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Add project filtering if projectId is provided
    if (projectId) {
      where.teams = {
        some: {
          projectId
        }
      };
    }

    // Build the orderBy clause
    let orderByClause: any = { [orderBy]: direction };

    // Fetch users with our enhanced getUsers function
    const result = await getUsers({
      skip,
      take: limit,
      orderBy: orderByClause,
      where,
      includeProjects,
      includeTasks,
      includeTeams,
      includeCounts
    });

    // Return in the format expected by the client
    return NextResponse.json({
      users: result.users,
      pagination: {
        page,
        limit,
        totalCount: result.pagination.totalCount,
        totalPages: Math.ceil(result.pagination.totalCount / limit)
      },
      ...(result.counts ? { counts: result.counts } : {})
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { name, email, password, role, image } = body;

    // Only admins can set roles other than 'user'
    if (role && role !== 'user' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can create users with elevated roles' },
        { status: 403 }
      );
    };

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser({
      name,
      email,
      password,
      role,
      image,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle duplicate email
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}