import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * API endpoint to fetch tracking history from our database
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const trackingNumber = searchParams.get('trackingNumber');
    
    // Validate input - need at least one parameter
    if (!orderId && !trackingNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Either orderId or trackingNumber is required' 
        },
        { status: 400 }
      );
    }
    
    // Build the query
    const query: Record<string, unknown> = {};
    
    if (orderId) {
      const orderIdInt = parseInt(orderId);
      if (isNaN(orderIdInt)) {
        return NextResponse.json(
          { success: false, error: 'Invalid orderId format' },
          { status: 400 }
        );
      }
      query.orderId = orderIdInt;
    }
    
    if (trackingNumber) {
      query.trackingNumber = trackingNumber;
    }
    
    console.log('Fetching tracking history with query:', query);
    
    // Fetch tracking history from database
    const trackingHistory = await prisma.trackingHistory.findMany({
      where: query,
      orderBy: {
        checkpointTime: 'desc'
      }
    });
    
    if (trackingHistory.length === 0) {
      console.log(`No tracking history found for ${orderId ? 'order ' + orderId : ''} ${trackingNumber ? 'tracking ' + trackingNumber : ''}`);
      return NextResponse.json({
        success: true,
        trackingHistory: []
      });
    }
    
    console.log(`Found ${trackingHistory.length} tracking history records`);
    
    // Return the tracking history
    return NextResponse.json({
      success: true,
      trackingHistory
    });
    
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 