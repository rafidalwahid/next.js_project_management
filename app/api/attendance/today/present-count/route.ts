import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { getDayBoundaries } from '@/lib/utils/attendance-date-utils';

export async function GET() {
  try {
    // Auth check would go here in production
    // const session = await getServerSession();
    // if (!session?.user) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    
    // Get today's date boundaries for the query
    const today = new Date();
    const { start, end } = getDayBoundaries(today);
    
    // Count unique users who have checked in today (regardless of checkout status)
    const count = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: start,
          lte: end,
        },
      },
      distinct: ['userId'], // Count each user only once
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching present count:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch present count' }), { 
      status: 500 
    });
  }
}