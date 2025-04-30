import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { getDayBoundaries, getLateThreshold } from '@/lib/utils/attendance-date-utils';

export async function GET() {
  try {
    // Auth check would go here in production
    // const session = await getServerSession();
    // if (!session?.user) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    
    // Get today's date boundaries for the query
    const today = new Date();
    const { start, end } = getDayBoundaries(today);
    const lateThreshold = getLateThreshold(today);
    
    // Count unique users who checked in late today
    const count = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: lateThreshold,
          lte: end,
        },
      },
      distinct: ['userId'], // Count each user only once
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching late count:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch late count' }), { 
      status: 500 
    });
  }
}