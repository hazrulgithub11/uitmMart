import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ 
        error: 'orderId is required', 
        success: false 
      }, { status: 400 });
    }

    console.log(`Fetching tracking history for order: ${orderId}`);

    // Use raw SQL query instead of Prisma model directly
    const trackingHistory = await prisma.$queryRaw`
      SELECT * FROM "TrackingHistory" 
      WHERE "orderId" = ${parseInt(orderId, 10)}
      ORDER BY "checkpointTime" DESC
    `;

    if (!trackingHistory || !Array.isArray(trackingHistory) || trackingHistory.length === 0) {
      console.log(`No tracking history found for order ${orderId}`);
      // Return empty array instead of null to avoid frontend errors
      return NextResponse.json({ 
        success: true, 
        trackingHistory: [],
        message: 'No tracking history found'
      });
    }

    console.log(`Found ${trackingHistory.length} tracking history records for order ${orderId}`);
    return NextResponse.json({ 
      success: true,
      trackingHistory: trackingHistory 
    });
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch tracking history',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 