import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * API endpoint to simulate tracking webhooks for testing
 * This is used to simulate tracking updates without waiting for real webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { trackingNumber, courierCode, orderId } = body;
    
    // Validate input
    if (!trackingNumber || !courierCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'trackingNumber and courierCode are required' 
        },
        { status: 400 }
      );
    }
    
    // Verify order exists
    let orderIdToUse = orderId;
    if (!orderIdToUse) {
      // Try to find the order by tracking number
      const order = await prisma.order.findFirst({
        where: {
          trackingNumber,
          courierCode
        },
        select: { id: true }
      });
      
      if (order) {
        orderIdToUse = order.id;
      } else {
        return NextResponse.json(
          { success: false, error: 'No order found with this tracking number and courier' },
          { status: 404 }
        );
      }
    }
    
    console.log(`Simulating webhook for tracking ${trackingNumber} and order ${orderIdToUse}`);
    
    // Get API key from environment variable
    const apiKey = process.env.TRACKING_MY_API_KEY;
    
    if (!apiKey) {
      console.error('TRACKING_MY_API_KEY is not set in environment variables');
      return NextResponse.json(
        { success: false, error: 'Tracking API key is not configured' },
        { status: 500 }
      );
    }
    
    // Fetch latest tracking data from tracking.my API
    const response = await fetch(`https://seller.tracking.my/api/v1/trackings/${courierCode}/${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Tracking-Api-Key': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Failed to fetch tracking details',
          originalData: errorData
        },
        { status: response.status }
      );
    }
    
    const responseData = await response.json();
    console.log('Tracking API response:', JSON.stringify(responseData).substring(0, 500) + '...');
    
    if (!responseData.tracking) {
      return NextResponse.json(
        { success: false, error: 'No tracking data found' },
        { status: 404 }
      );
    }
    
    // Construct a simulated webhook payload
    const webhookPayload = {
      event: 'trackings/checkpoint_update',
      data: {
        tracking: responseData.tracking
      }
    };
    
    // Call our webhook endpoint
    const webhookResponse = await fetch(new URL('/api/tracking/webhook', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    if (!webhookResponse.ok) {
      const webhookError = await webhookResponse.json();
      return NextResponse.json(
        { 
          success: false, 
          error: 'Webhook processing failed',
          details: webhookError
        },
        { status: webhookResponse.status }
      );
    }
    
    const webhookResult = await webhookResponse.json();
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook simulation successful',
      webhookResult,
      trackingData: {
        status: responseData.tracking.status,
        latestCheckpoint: responseData.tracking.latest_checkpoint
      }
    });
    
  } catch (error) {
    console.error('Error in webhook simulation:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}