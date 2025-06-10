import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

// Initialize Prisma client
const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * API endpoint to fetch shipment status from tracking.my
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.TRACKING_MY_API_KEY;
    
    if (!apiKey) {
      console.error('TRACKING_MY_API_KEY is not set in environment variables');
      return NextResponse.json(
        { success: false, error: 'Tracking API key is not configured' },
        { status: 500 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const trackingNumber = searchParams.get('trackingNumber');
    const courierCode = searchParams.get('courierCode');
    
    // Validate input
    if (!trackingNumber || !courierCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'trackingNumber and courierCode are required query parameters' 
        },
        { status: 400 }
      );
    }
    
    console.log(`Fetching tracking details for: ${trackingNumber} with courier: ${courierCode}`);
    
    // Make request to tracking.my API to get latest checkpoint data
    const response = await fetch(`https://seller.tracking.my/api/v1/trackings/${courierCode}/${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Tracking-Api-Key': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Get response data
    const responseData = await response.json();
    
    // Log response for debugging
    console.log('Tracking.my API response:', JSON.stringify(responseData).substring(0, 500) + '...');
    
    // Check if request was successful
    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: responseData.message || 'Failed to fetch tracking details',
          originalData: responseData
        },
        { status: response.status }
      );
    }
    
    // Process the tracking data
    let checkpoints = [];
    let mainStatus = 'info_received';
    let detailedStatus = 'Information Received';
    let shortLink = null;
    
    if (responseData && responseData.tracking) {
      const tracking = responseData.tracking;
      
      // Get the short link if available
      shortLink = tracking.short_link || null;
      
      // Set the main status
      mainStatus = tracking.status || 'info_received';
      
      // Map the main status to a more detailed status description
      switch(mainStatus) {
        case 'info_received': 
          detailedStatus = 'Information Received';
          break;
        case 'pending': 
          detailedStatus = 'Pending';
          break;
        case 'in_transit': 
          detailedStatus = 'In Transit';
          break;
        case 'out_for_delivery': 
          detailedStatus = 'Out for Delivery';
          break;
        case 'delivered': 
          detailedStatus = 'Delivered';
          break;
        case 'exception': 
          detailedStatus = 'Exception';
          break;
        case 'failed_attempt': 
          detailedStatus = 'Failed Delivery Attempt';
          break;
        case 'cancelled': 
          detailedStatus = 'Cancelled';
          break;
        default: 
          detailedStatus = mainStatus.charAt(0).toUpperCase() + mainStatus.slice(1).replace(/_/g, ' ');
      }
      
      // Get latest checkpoint if available
      if (tracking.latest_checkpoint) {
        console.log('Latest checkpoint found:', JSON.stringify(tracking.latest_checkpoint));
        checkpoints = [tracking.latest_checkpoint];
      }
      
      // Get all checkpoints if available
      if (tracking.checkpoints && Array.isArray(tracking.checkpoints)) {
        console.log(`Found ${tracking.checkpoints.length} checkpoints in response`);
        checkpoints = tracking.checkpoints;
      }
      
      // If we have latest_checkpoint but no checkpoints array, use it
      if (checkpoints.length === 0 && tracking.latest_checkpoint) {
        checkpoints = [tracking.latest_checkpoint];
      }
      
      // Try to update order with shortLink
      try {
        // First, check if we have an order ID in the query parameters
        let orderId = null;
        const orderIdParam = searchParams.get('orderId');
        
        if (orderIdParam) {
          orderId = parseInt(orderIdParam);
        } else {
          // If no orderId provided, try to find the order by tracking number
          const order = await prisma.order.findFirst({
            where: { 
              trackingNumber: trackingNumber,
              courierCode: courierCode
            },
            select: { id: true }
          });
          
          if (order) {
            orderId = order.id;
            console.log(`Found order ${orderId} for tracking number ${trackingNumber}`);
          }
        }
        
        // If we have an orderId and shortLink, update the order
        if (orderId && shortLink) {
          await prisma.order.update({
            where: { id: orderId },
            data: { 
              shortLink,
              detailedTrackingStatus: detailedStatus
            }
          });
          console.log(`Updated order ${orderId} with short link: ${shortLink}`);
        }
      } catch (error) {
        console.error('Failed to update order with short link:', error);
      }
      
      // Save the tracking history to our database for persistence
      try {
        await saveTrackingHistory(trackingNumber, courierCode, checkpoints);
      } catch (error) {
        console.error('Failed to save tracking history:', error);
        // Continue anyway, this is just for persistence
      }
    }
    
    // Return processed response
    return NextResponse.json({
      success: true,
      trackingNumber,
      courierCode,
      courierName: responseData.tracking?.courier_name || courierCode,
      mainStatus,
      detailedStatus,
      shortLink,
      checkpoints,
      message: checkpoints.length > 0 
        ? 'Tracking information found' 
        : 'No tracking checkpoints available yet',
      originalData: responseData
    });
    
  } catch (error) {
    console.error('Error in tracking API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

/**
 * Save tracking history to database for persistence
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveTrackingHistory(trackingNumber: string, courierCode: string, checkpoints: any[]) {
  console.log('Saving tracking history for:', trackingNumber, courierCode, checkpoints.length, 'checkpoints');
  
  if (!checkpoints || checkpoints.length === 0) {
    console.log('No checkpoints to save');
    return { success: true, message: 'No checkpoints to save' };
  }
  
  try {
    // Find the order associated with this tracking number
    const order = await prisma.order.findFirst({
      where: {
        trackingNumber,
        courierCode
      },
      select: {
        id: true
      }
    });
    
    if (!order) {
      console.warn(`No order found for tracking number ${trackingNumber} and courier ${courierCode}`);
      return { success: false, message: 'No associated order found' };
    }
    
    const orderId = order.id;
    console.log(`Found order ${orderId} for tracking ${trackingNumber}`);
    
    // Process each checkpoint and save to database
    const savedCheckpoints = [];
    
    for (const checkpoint of checkpoints) {
      // Extract checkpoint data with fallbacks for different API response formats
      const checkpointTime = new Date(
        checkpoint.time || 
        checkpoint.checkpoint_time || 
        checkpoint.created_at || 
        new Date()
      );
      
      const status = checkpoint.status || 'info_received';
      const details = checkpoint.content || checkpoint.message || checkpoint.description || '';
      const location = checkpoint.location || '';
      
      // Create a unique identifier for the checkpoint to avoid duplicates
      const checkpointIdentifier = `${orderId}-${trackingNumber}-${checkpointTime.toISOString()}-${details}`;
      
      try {
        // Use upsert to avoid duplicate checkpoints
        const savedCheckpoint = await prisma.trackingHistory.upsert({
          where: {
            // Create a compound ID that matches our unique constraint
            id: checkpointIdentifier
          },
          update: {
            // If it exists, update these fields
            status,
            location,
            rawData: checkpoint
          },
          create: {
            // If it doesn't exist, create a new record
            id: checkpointIdentifier,
            orderId,
            trackingNumber,
            courierCode,
            status,
            details,
            location,
            checkpointTime,
            rawData: checkpoint
          }
        });
        
        savedCheckpoints.push(savedCheckpoint);
        console.log(`Saved checkpoint: ${status} at ${location} (${checkpointTime.toISOString()})`);
      } catch (error) {
        console.error(`Failed to save checkpoint: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with other checkpoints even if one fails
      }
    }
    
    return { 
      success: true, 
      message: `Saved ${savedCheckpoints.length} checkpoints for order ${orderId}` 
    };
  } catch (error) {
    console.error('Failed to save tracking history:', error);
    throw error;
  }
} 