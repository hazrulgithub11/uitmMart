import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to simulate a webhook for tracking updates
 * This endpoint will be called to simulate tracking.my sending an update
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { trackingNumber, courierCode, orderId } = body;
    
    console.log(`========== WEBHOOK SIMULATION START ==========`);
    console.log(`Simulating webhook for: ${trackingNumber} (${courierCode}), Order ID: ${orderId}`);
    
    if (!trackingNumber || !courierCode) {
      return NextResponse.json(
        { success: false, error: 'trackingNumber and courierCode are required' },
        { status: 400 }
      );
    }
    
    // Get API key from environment variable
    const apiKey = process.env.TRACKING_MY_API_KEY;
    
    if (!apiKey) {
      console.error('TRACKING_MY_API_KEY is not set in environment variables');
      return NextResponse.json(
        { success: false, error: 'Tracking API key is not configured' },
        { status: 500 }
      );
    }
    
    // Fetch latest tracking information from tracking.my
    const apiUrl = `https://seller.tracking.my/api/v1/trackings/${courierCode}/${trackingNumber}`;
    console.log(`Fetching tracking data from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Tracking-Api-Key': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from tracking.my API:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Failed to fetch tracking details',
          originalData: errorData
        },
        { status: response.status }
      );
    }
    
    // Get response data
    const responseText = await response.text();
    console.log('========== RAW RESPONSE FROM TRACKING.MY ==========');
    console.log(responseText);
    console.log('==================================================');
    
    const responseData = JSON.parse(responseText);
    
    if (!responseData.tracking) {
      console.error('No tracking data found in response');
      return NextResponse.json(
        { success: false, error: 'Invalid tracking data format' },
        { status: 400 }
      );
    }
    
    // Get checkpoints
    const trackingData = responseData.tracking;
    const checkpoints = trackingData.checkpoints || [];
    
    if (checkpoints.length === 0 && trackingData.latest_checkpoint) {
      console.log('No checkpoints array found, using latest_checkpoint only');
      checkpoints.push(trackingData.latest_checkpoint);
    }
    
    // Log checkpoints information
    console.log(`========== CHECKPOINTS INFO ==========`);
    console.log(`Total checkpoints received: ${checkpoints.length}`);
    console.log('Checkpoints array:');
    console.log(JSON.stringify(checkpoints, null, 2));
    console.log('=====================================');
    
    // Create a simulated webhook event structure
    const webhookEvent = {
      event: "tracking_checkpoint_update",
      tracking: {
        id: trackingData.id || Math.floor(Math.random() * 10000),
        note: null,
        smses: [],
        reason: trackingData.reason,
        status: trackingData.status || 'info_received',
        courier: courierCode,
        order_id: orderId || null,
        created_at: trackingData.created_at || new Date().toISOString(),
        deleted_at: null,
        short_link: trackingData.short_link || `https://tracking.my/s/${Math.random().toString(36).substring(2, 10)}`,
        updated_at: trackingData.updated_at || new Date().toISOString(),
        checkpoints: checkpoints,
        order_number: trackingData.order_number || null,
        parcel_image: null,
        customer_name: trackingData.customer_name || null,
        customer_email: trackingData.customer_email || null,
        customer_phone: trackingData.customer_phone || null,
        parcel_content: trackingData.parcel_content || null,
        tracking_number: trackingNumber,
        latest_checkpoint: trackingData.latest_checkpoint || (checkpoints.length > 0 ? checkpoints[0] : null)
      }
    };
    
    // Save tracking history to database
    await saveTrackingHistory(trackingNumber, courierCode, orderId, checkpoints, trackingData.short_link);
    
    console.log(`========== WEBHOOK SIMULATION END ==========`);
    
    return NextResponse.json({
      success: true,
      message: 'Tracking webhook simulated successfully',
      webhookEvent
    });
    
  } catch (error) {
    console.error('Error in tracking webhook:', error);
    
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
 * Save tracking history to database
 */
async function saveTrackingHistory(
  trackingNumber: string, 
  courierCode: string, 
  orderId: number | null, 
  checkpoints: Record<string, unknown>[],
  shortLink?: string
) {
  console.log(`Saving tracking history for order ${orderId}, tracking ${trackingNumber}`);
  
  if (!checkpoints || checkpoints.length === 0) {
    console.log('No checkpoints to save');
    return;
  }
  
  try {
    console.log(`Starting to process ${checkpoints.length} checkpoints for database storage`);
    
    // Update the order with shortLink if provided
    if (orderId && shortLink) {
      try {
        console.log(`Updating order ${orderId} with short link: ${shortLink}`);
        await prisma.order.update({
          where: { id: orderId },
          data: { shortLink }
        });
      } catch (error) {
        console.error('Failed to update order with short link:', error);
      }
    }
    
    // For each checkpoint, create or update a record in the database
    for (const checkpoint of checkpoints) {
      const checkpointTime = (checkpoint.time || checkpoint.checkpoint_time || new Date().toISOString()) as string;
      const status = (checkpoint.status || 'info_received') as string;
      const details = (checkpoint.content || checkpoint.message || checkpoint.description || 'Status update') as string;
      const location = (checkpoint.location || '') as string;
      const checkpointDate = new Date(checkpointTime);
      
      console.log(`Processing checkpoint: ${checkpointDate.toISOString()} - ${status} - ${details}`);
      
      // Skip if we don't have an orderId
      if (!orderId) {
        console.log('Skipping tracking history creation: orderId is required');
        continue;
      }
      
      try {
        // First check if the record already exists
        const existingRecord = await prisma.trackingHistory.findFirst({
          where: {
            orderId,
            trackingNumber,
            checkpointTime: checkpointDate,
            details
          }
        });
        
        if (existingRecord) {
          // Update existing record if status or location has changed
          if (existingRecord.status !== status || existingRecord.location !== location) {
            await prisma.trackingHistory.update({
              where: { id: existingRecord.id },
              data: {
                status,
                location
              }
            });
            console.log(`Updated existing tracking record ${existingRecord.id}`);
          } else {
            console.log(`Skipping duplicate tracking record for checkpoint time ${checkpointDate}`);
          }
        } else {
          // Create a new record
          // Explicitly specify all fields
          await prisma.$executeRaw`
            INSERT INTO "TrackingHistory" (
              "id", "orderId", "trackingNumber", "courierCode", "status", 
              "details", "location", "checkpointTime", "createdAt"
            ) VALUES (
              ${crypto.randomUUID()}, ${orderId}, ${trackingNumber}, ${courierCode}, ${status},
              ${details}, ${location}, ${checkpointDate}, ${new Date()}
            )
            ON CONFLICT ("orderId", "trackingNumber", "checkpointTime", "details") 
            DO NOTHING
          `;
          
          console.log(`Created new tracking record for checkpoint time ${checkpointDate}`);
        }
      } catch (innerError) {
        // Log and continue with next checkpoint
        console.error(`Error processing checkpoint ${checkpointDate}:`, innerError);
        continue;
      }
    }
    
    console.log(`Successfully processed ${checkpoints.length} checkpoints for tracking history`);
    return true;
  } catch (error) {
    console.error('Error saving tracking history:', error);
    throw error;
  }
}