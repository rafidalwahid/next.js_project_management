import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { unstable_cache } from 'next/cache';

// Cache dashboard stats for 1 minute per user
const getDashboardStats = unstable_cache(
  async (userId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get total projects count for the user
    const totalProjects = await prisma.project.count({
      where: {
        teamMembers: {
          some: {
            userId
          }
        }
      }
    });

    // Get projects with their task counts
    const recentProjects = await prisma.project.findMany({
      where: {
        teamMembers: {
          some: {
            userId
          }
        }
      },
      include: {
        _count: {
          select: {
            tasks: true,
            teamMembers: true
          }
        },
        tasks: {
          select: {
            id: true,
            completed: true
          }
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    // Calculate project growth (comparing to last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const projectsLastMonth = await prisma.project.count({
      where: {
        teamMembers: {
          some: {
            userId
          }
        },
        createdAt: {
          lt: new Date()
        }
      }
    });

    const projectsThisMonth = await prisma.project.count({
      where: {
        teamMembers: {
          some: {
            userId
          }
        },
        createdAt: {
          gte: lastMonth
        }
      }
    });

    const growthRate = projectsLastMonth > 0
      ? ((projectsThisMonth - projectsLastMonth) / projectsLastMonth) * 100
      : 0;

    return {
      totalProjects,
      recentProjects: recentProjects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        teamCount: project._count.teamMembers,
        taskCount: project._count.tasks,
        completedTaskCount: project.tasks.filter(t => t.completed).length,
        progress: project._count.tasks > 0
          ? Math.round((project.tasks.filter(t => t.completed).length / project._count.tasks) * 100)
          : 0,
        team: project.teamMembers.map(member => member.user)
      })),
      projectGrowth: Math.round(growthRate)
    };
  },
  ['dashboard-stats'],
  { revalidate: 60 } // Cache for 1 minute
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const stats = await getDashboardStats(userId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}