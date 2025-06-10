import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * API endpoint to handle tracking webhooks from tracking.my
 * This endpoint receives updates when tracking status changes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if needed
    // const signature = request.headers.get('X-Tracking-Signature');
    
    // Parse webhook data
    const webhookData = await request.json();
    console.log('Received tracking webhook:', JSON.stringify(webhookData).substring(0, 500) + '...');
    
    // Extract tracking data
    const { event, data } = webhookData;
    
    if (!event || !data) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook data format' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${event} event for tracking`);
    
    // Extract tracking information
    const tracking = data.tracking;
    if (!tracking || !tracking.tracking_number || !tracking.courier) {
      return NextResponse.json(
        { success: false, error: 'Missing tracking information in webhook data' },
        { status: 400 }
      );
    }
    
    const { tracking_number: trackingNumber, courier: courierCode } = tracking;
    
    // Find the order associated with this tracking number
    const order = await prisma.order.findFirst({
      where: {
        trackingNumber,
        courierCode
      },
      select: {
        id: true,
        status: true,
        shippedAt: true
      }
    });
    
    if (!order) {
      console.warn(`No order found for tracking number ${trackingNumber} and courier ${courierCode}`);
      return NextResponse.json(
        { success: false, error: 'No associated order found' },
        { status: 404 }
      );
    }
    
    console.log(`Found order ${order.id} for tracking ${trackingNumber}`);
    
    // Process tracking updates based on event type
    switch (event) {
      case 'trackings/create':
        // New tracking created - update shortLink if available
        if (tracking.short_link) {
          await prisma.order.update({
            where: { id: order.id },
            data: { shortLink: tracking.short_link }
          });
          console.log(`Updated order ${order.id} with short link: ${tracking.short_link}`);
        }
        break;
        
      case 'trackings/update':
      case 'trackings/checkpoint_update':
        // Status update - process checkpoints
        const checkpoints = [];
        
        // Add latest checkpoint if available
        if (tracking.latest_checkpoint) {
          checkpoints.push(tracking.latest_checkpoint);
        }
        
        // Add all checkpoints if available
        if (tracking.checkpoints && Array.isArray(tracking.checkpoints)) {
          checkpoints.push(...tracking.checkpoints);
        }
        
        // Update order status based on tracking status
        if (tracking.status) {
          const statusMapping: Record<string, string> = {
            'info_received': 'processing',
            'pending': 'processing',
            'in_transit': 'shipped',
            'out_for_delivery': 'shipped',
            'delivered': 'delivered',
            'exception': 'shipped',
            'failed_attempt': 'shipped',
            'cancelled': 'cancelled'
          };
          
          const newStatus = statusMapping[tracking.status] || order.status;
          
          // Only update if the new status is different and represents progress
          if (newStatus !== order.status) {
            // For delivered status, add deliveredAt timestamp
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updateData: Record<string, any> = { 
              status: newStatus,
              detailedTrackingStatus: tracking.status
            };
            
            if (newStatus === 'delivered') {
              updateData.deliveredAt = new Date();
            } else if (newStatus === 'shipped' && !order.shippedAt) {
              updateData.shippedAt = new Date();
            }
            
            await prisma.order.update({
              where: { id: order.id },
              data: updateData
            });
            
            console.log(`Updated order ${order.id} status to ${newStatus}`);
          }
        }
        
        // Save checkpoints to tracking history
        if (checkpoints.length > 0) {
          await saveTrackingHistory(trackingNumber, courierCode, checkpoints, order.id);
        }
        break;
        
      default:
        console.warn(`Unknown webhook event type: ${event}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${event} webhook for tracking ${trackingNumber}`
    });
    
  } catch (error) {
    console.error('Error processing tracking webhook:', error);
    
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveTrackingHistory(trackingNumber: string, courierCode: string, checkpoints: any[], orderId: number) {
  if (!checkpoints || checkpoints.length === 0) {
    console.log('No checkpoints to save');
    return { success: true, message: 'No checkpoints to save' };
  }
  
  try {
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
      
      // Create a unique identifier for the checkpoint
      const checkpointId = `${orderId}-${trackingNumber}-${checkpointTime.toISOString()}-${details.substring(0, 20)}`;
      
      try {
        // Use upsert to avoid duplicate checkpoints
        const savedCheckpoint = await prisma.trackingHistory.upsert({
          where: {
            id: checkpointId
          },
          update: {
            status,
            location,
            rawData: checkpoint
          },
          create: {
            id: checkpointId,
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