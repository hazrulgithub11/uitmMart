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
        checkpoints = [tracking.latest_checkpoint];
      }
      
      // Get all checkpoints if available
      if (tracking.checkpoints && Array.isArray(tracking.checkpoints)) {
        checkpoints = tracking.checkpoints;
      }
      
      // If we have an order ID in the query parameters, update the order with the short link
      const orderIdParam = searchParams.get('orderId');
      if (shortLink && orderIdParam) {
        const orderId = parseInt(orderIdParam);
        if (!isNaN(orderId)) {
          try {
            // Update the order with the shortLink
            await prisma.order.update({
              where: { id: orderId },
              data: { shortLink }
            });
            console.log(`Updated order ${orderId} with short link: ${shortLink}`);
          } catch (error) {
            console.error('Failed to update order with short link:', error);
          }
        }
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
async function saveTrackingHistory(trackingNumber: string, courierCode: string, checkpoints: unknown[]) {
  // This should be implemented to save the tracking history to a database
  // For now, just log it
  console.log('Would save tracking history for:', trackingNumber, courierCode, checkpoints.length, 'checkpoints');
  
  try {
    // Directly use Prisma here instead of making an API call to avoid URL issues
    // If we have the orderId from a query parameter or context, we would use it here
    // For now, this function will log but not actually save anything
    console.log('Checkpoints data:', JSON.stringify(checkpoints.slice(0, 2), null, 2) + '...');
    
    // If needed later, implement direct Prisma calls here
    // This would avoid the need for another API call within the same backend
    
    return { success: true, message: 'Tracking history logged (not saved)' };
  } catch (error) {
    console.error('Failed to process tracking history:', error);
    throw error;
  }
} 