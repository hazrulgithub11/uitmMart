import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Status mapping based on the provided table
const statusMapping = {
  'Info Received': 'pending',
  'Available for Pickup': 'pending',
  'Pending': 'pending',
  'Generated': 'processing',
  'Printed': 'processing',
  'In Transit': 'shipped',
  'Delivery Office': 'shipped',
  'Out for Delivery': 'shipped',
  'Attempt Fail': 'shipped',
  'Exception': 'shipped',
  'Delivered': 'delivered',
  'Completed': 'delivered',
  'Cancelled': 'cancelled',
  'Returned': 'cancelled',
  'Expired': 'cancelled'
};



// Define interfaces for the data structures we're working with
interface Buyer {
  fullName: string;
  email: string;
  phoneNumber: string | null;
}

// Define an interface for order structure
interface OrderData {
  id: number;
  buyer?: Buyer;
  shippingAddress?: unknown;
  orderNumber?: string;
  createdAt?: string | Date;
  items?: unknown[];
  deliveredAt?: string | Date;
  shippedAt?: string | Date;
  status?: string;
  courierCode?: string;
  courierName?: string;
  detailedTrackingStatus?: string;
  trackingHistory?: unknown[];
}

// Helper function to format checkpoint data for consistent display
function formatCheckpoint(checkpoint: unknown) {
  const cp = checkpoint as Record<string, unknown>;
  return {
    date: new Date(cp.checkpoint_time as string || cp.time as string || cp.created_at as string || new Date()),
    location: cp.location as string || '',
    message: cp.message as string || cp.content as string || cp.description as string || cp.status as string || 'Status update',
    status: cp.status as string || 'unknown'
  };
}

// Main API endpoint handler
export async function GET(req: Request) {
  try {
    // Get tracking number from query parameters
    const { searchParams } = new URL(req.url);
    const trackingNumber = searchParams.get('trackingNumber');
    let courierCode = searchParams.get('courierCode');
    const forceFetch = searchParams.get('forceFetch') === 'true';
    
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required', success: false },
        { status: 400 }
      );
    }
    
    // First, check our database for cached tracking history
    let trackingData = null;
    let databaseCheckpoints = [];
    
    // Try to find order with this tracking number
    const order = await prisma.order.findFirst({
      where: { trackingNumber },
      include: {
        trackingHistory: {
          orderBy: { checkpointTime: 'desc' },
        },
        items: true,
        buyer: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
          }
        },
        shippingAddress: true,
      }
    });
    
    // If we have order and tracking history in our database
    if (order && order.trackingHistory.length > 0) {
      databaseCheckpoints = order.trackingHistory.map(checkpoint => ({
        date: checkpoint.checkpointTime,
        location: checkpoint.location || '',
        message: checkpoint.details || checkpoint.status,
        status: checkpoint.status
      }));
      
      // If not forcing a refresh, use the database data directly
      if (!forceFetch) {
        // Basic tracking info from our database
        trackingData = {
          success: true,
          tracking_number: trackingNumber,
          courier_code: order.courierCode || courierCode || 'unknown',
          courier_name: order.courierName || 'Unknown Courier',
          status: order.status,
          detailed_status: order.detailedTrackingStatus || 'Processing',
          checkpoints: databaseCheckpoints,
          customer: order.buyer ? {
            name: order.buyer.fullName,
            email: order.buyer.email,
            phone: order.buyer.phoneNumber
          } : null,
          shipping_address: order.shippingAddress,
          order_number: order.orderNumber,
          created_at: order.createdAt,
          items: order.items,
          delivered_at: order.deliveredAt,
          shipped_at: order.shippedAt,
          source: 'database'
        };
      }
    }
    
    // If no data in database or force fetch is true, try to get from tracking.my API
    if (!trackingData || forceFetch) {
      // Get API key from environment variables
      const apiKey = process.env.TRACKING_MY_API_KEY;
      
      if (!apiKey) {
        // If no API key and we have database data, return that
        if (trackingData) {
          return NextResponse.json(trackingData);
        }
        
        return NextResponse.json(
          { error: 'Tracking API key not configured', success: false },
          { status: 500 }
        );
      }
      
      // Prepare the API url based on whether courier code is available
      let trackingUrl;
      if (courierCode) {
        trackingUrl = `https://seller.tracking.my/api/v1/trackings/${courierCode}/${trackingNumber}`;
      } else {
        trackingUrl = `https://seller.tracking.my/api/v1/trackings/${trackingNumber}`;
      }
      
      // Call the tracking.my API
      const response = await fetch(trackingUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Tracking-Api-Key': apiKey
        },
        cache: forceFetch ? 'no-store' : 'default'
      });
      
      // Parse response
      if (response.ok) {
        const data = await response.json();
        
        // Extract checkpoints depending on response format
        let checkpoints = [];
        let status = 'processing';
        let detailedStatus = 'Processing';
        let courierName = '';
        
        // Handle different response formats
        if (data.tracking) {
          // Format 1: Tracking object with latest_checkpoint
          if (data.tracking.latest_checkpoint) {
            const latestCP = data.tracking.latest_checkpoint;
            checkpoints = [{
              date: new Date(latestCP.time),
              location: latestCP.location || '',
              message: latestCP.content || latestCP.status,
              status: latestCP.status
            }];
            
            detailedStatus = latestCP.content || latestCP.status;
            status = data.tracking.status || mapStatusFromDetailed(detailedStatus);
          }
          
          // Format 2: Tracking object with checkpoints array
          else if (data.tracking.checkpoints && Array.isArray(data.tracking.checkpoints)) {
            checkpoints = data.tracking.checkpoints.map(formatCheckpoint);
            
            if (checkpoints.length > 0) {
              detailedStatus = checkpoints[0].message;
              status = data.tracking.status || mapStatusFromDetailed(detailedStatus);
            }
          }
          
          // Extract courier info
          courierName = typeof data.tracking.courier === 'object' 
            ? data.tracking.courier.name || data.tracking.courier.code 
            : data.tracking.courier;
          
          courierCode = typeof data.tracking.courier === 'object'
            ? data.tracking.courier.code
            : data.tracking.courier;
        }
        
        // Format 3: Data object with checkpoints
        else if (data.data && data.data.checkpoints) {
          checkpoints = data.data.checkpoints.map(formatCheckpoint);
          
          if (checkpoints.length > 0) {
            detailedStatus = checkpoints[0].message;
            status = data.data.status || data.data.delivery_status || mapStatusFromDetailed(detailedStatus);
          }
          
          // Extract courier info
          courierName = data.data.courier?.name || data.data.courier_name || '';
          courierCode = data.data.courier?.code || data.data.courier_code || courierCode;
        }
        
        // If no checkpoints found, create an initial status
        if (checkpoints.length === 0) {
          checkpoints = [{
            date: new Date(),
            location: '',
            message: 'Shipment information received',
            status: 'info_received'
          }];
        }
        
        // Sort checkpoints by date (newest first)
        checkpoints.sort((a: unknown, b: unknown) => {
          const aDate = (a as Record<string, unknown>).date as Date;
          const bDate = (b as Record<string, unknown>).date as Date;
          return bDate.getTime() - aDate.getTime();
        });
        
        // Store checkpoints in database if we have an order
        if (order) {
          const orderData = order as OrderData;
          await storeCheckpointsInDatabase(orderData.id, trackingNumber, checkpoints);
          
          // Update order status based on tracking status
          if (status !== 'processing') {
            await updateOrderStatus(orderData.id, status, detailedStatus);
          }
        }
        
        // Create tracking data response
        trackingData = {
          success: true,
          tracking_number: trackingNumber,
          courier_code: courierCode || 'unknown',
          courier_name: courierName || 'Unknown Courier',
          status: status,
          detailed_status: detailedStatus,
          checkpoints: checkpoints,
          customer: order?.buyer ? {
            name: (order.buyer as Buyer).fullName,
            email: (order.buyer as Buyer).email,
            phone: (order.buyer as Buyer).phoneNumber
          } : null,
          shipping_address: order?.shippingAddress,
          order_number: order?.orderNumber,
          created_at: order?.createdAt,
          items: order?.items,
          delivered_at: order?.deliveredAt,
          shipped_at: order?.shippedAt,
          source: 'api'
        };
      } else {
        // If API call failed but we have database data, return that
        if (trackingData) {
          return NextResponse.json(trackingData);
        }
        
        // Fallback to all trackings endpoint if direct query failed
        return await fallbackToAllTrackings(trackingNumber, apiKey, order);
      }
    }
    
    // Calculate estimated delivery date if not delivered
    if (trackingData && trackingData.status !== 'delivered' && !trackingData.delivered_at) {
      // Add estimated delivery date - typically 3-5 days from first checkpoint
      if (trackingData.checkpoints && trackingData.checkpoints.length > 0) {
        const firstDate = trackingData.checkpoints[trackingData.checkpoints.length - 1].date;
        const estimatedDelivery = new Date(firstDate);
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 4); // Average 4 days delivery
        // @ts-expect-error - Property doesn't exist on type
        trackingData.estimated_delivery = estimatedDelivery;
      }
    }
    
    return NextResponse.json(trackingData);
    
  } catch (error) {
    console.error('Error in tracking endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch tracking details',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to map detailed status to main status
function mapStatusFromDetailed(detailedStatus: string): string {
  for (const [detailStatus, mainStatusValue] of Object.entries(statusMapping)) {
    if (detailedStatus.toLowerCase().includes(detailStatus.toLowerCase())) {
      return mainStatusValue;
    }
  }
  return 'processing'; // Default status
}

// Helper function to store checkpoints in database
async function storeCheckpointsInDatabase(orderId: number, trackingNumber: string, checkpoints: unknown[]) {
  for (const checkpoint of checkpoints) {
    const cp = checkpoint as Record<string, unknown>;
    try {
      await prisma.trackingHistory.create({
        data: {
          orderId,
          trackingNumber,
          courierCode: 'unknown',
          status: cp.status as string || 'unknown',
          details: cp.message as string || 'Status update',
          location: cp.location as string || '',
          checkpointTime: cp.date as Date || new Date(),
          // Use JSON.stringify for Prisma JSON fields
          rawData: JSON.stringify(checkpoint)
        }
      });
    } catch (error) {
      console.error('Error storing tracking checkpoint:', error);
    }
  }
}

// Helper function to update order status based on tracking status
async function updateOrderStatus(orderId: number, status: string, detailedStatus: string) {
  try {
    const statusPriority: Record<string, number> = {
      'pending': 1,
      'processing': 2,
      'shipped': 3,
      'delivered': 4,
      'cancelled': 5
    };
    
    // Get current order status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    });
    
    if (!order) return;
    
    const currentPriority = statusPriority[order.status.toLowerCase()] || 0;
    const newPriority = statusPriority[status] || 0;
    
    // Only update if new status is more advanced
    if (newPriority > currentPriority) {
      const updateData: Record<string, unknown> = {
        status,
        detailedTrackingStatus: detailedStatus
      };
      
      // Add shipped/delivered timestamps
      if (status === 'shipped' && newPriority > currentPriority) {
        updateData.shippedAt = new Date();
      } else if (status === 'delivered' && newPriority > currentPriority) {
        updateData.deliveredAt = new Date();
      }
      
      await prisma.order.update({
        where: { id: orderId },
        data: updateData
      });
    } else {
      // Just update detailed status
      await prisma.order.update({
        where: { id: orderId },
        data: { detailedTrackingStatus: detailedStatus }
      });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
  }
}

// Helper function to use the all trackings endpoint as fallback
async function fallbackToAllTrackings(trackingNumber: string, apiKey: string, order: unknown) {
  try {
    const response = await fetch('https://seller.tracking.my/api/v1/trackings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Tracking-Api-Key': apiKey
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      // If we have an order but no API data, create a basic tracking record
      if (order) {
        return createBasicTrackingResponse(trackingNumber, order);
      }
      
      return NextResponse.json(
        { error: 'Failed to retrieve tracking information', success: false },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    const trackingsArray = data.data || data.trackings || [];
    
    if (!Array.isArray(trackingsArray) || trackingsArray.length === 0) {
      // If we have an order but no API data, create a basic tracking record
      if (order) {
        return createBasicTrackingResponse(trackingNumber, order);
      }
      
      return NextResponse.json(
        { error: 'No tracking information found', success: false },
        { status: 404 }
      );
    }
    
    // Find our tracking
    const tracking = trackingsArray.find((t: Record<string, unknown>) =>
      t.tracking_number === trackingNumber || 
      t.number === trackingNumber ||
      (t.trackingNumber && t.trackingNumber === trackingNumber)
    );
    
    if (!tracking) {
      // If we have an order but no API data, create a basic tracking record
      if (order) {
        return createBasicTrackingResponse(trackingNumber, order);
      }
      
      return NextResponse.json(
        { error: 'Tracking number not found', success: false },
        { status: 404 }
      );
    }
    
    // Extract checkpoint data from tracking
    let checkpoints = [];
    let status = 'processing';
    let detailedStatus = 'Processing';
    
    // Handle different tracking formats
    if (tracking.latest_checkpoint) {
      const latestCP = tracking.latest_checkpoint;
      checkpoints = [{
        date: new Date(latestCP.time),
        location: latestCP.location || '',
        message: latestCP.content || latestCP.status,
        status: latestCP.status
      }];
      
      detailedStatus = latestCP.content || latestCP.status;
      status = tracking.status || mapStatusFromDetailed(detailedStatus);
    }
    else if (tracking.checkpoints && Array.isArray(tracking.checkpoints)) {
      checkpoints = tracking.checkpoints.map(formatCheckpoint);
      
      if (checkpoints.length > 0) {
        detailedStatus = checkpoints[0].message;
        status = tracking.status || mapStatusFromDetailed(detailedStatus);
      }
    }
    
    // If no checkpoints found, create an initial status
    if (checkpoints.length === 0) {
      checkpoints = [{
        date: new Date(),
        location: '',
        message: 'Shipment information received',
        status: 'info_received'
      }];
    }
    
    // Sort checkpoints by date (newest first)
    checkpoints.sort((a: unknown, b: unknown) => {
      const aDate = (a as Record<string, unknown>).date as Date;
      const bDate = (b as Record<string, unknown>).date as Date;
      return bDate.getTime() - aDate.getTime();
    });
    
    // Store checkpoints in database if we have an order
    if (order) {
      const orderData = order as OrderData;
      await storeCheckpointsInDatabase(orderData.id, trackingNumber, checkpoints);
      
      // Update order status based on tracking status
      if (status !== 'processing') {
        await updateOrderStatus(orderData.id, status, detailedStatus);
      }
    }
    
    // Extract courier info
    const courierName = tracking.courier_name || 
      (typeof tracking.courier === 'object' ? tracking.courier.name : tracking.courier);
    
    const courierCode = tracking.courier_code || 
      (typeof tracking.courier === 'object' ? tracking.courier.code : tracking.courier);
    
    // Create tracking data response
    const orderData = order as OrderData;
    const trackingData = {
      success: true,
      tracking_number: trackingNumber,
      courier_code: courierCode || 'unknown',
      courier_name: courierName || 'Unknown Courier',
      status: status,
      detailed_status: detailedStatus,
      checkpoints: checkpoints,
      customer: orderData?.buyer ? {
        name: orderData.buyer.fullName,
        email: orderData.buyer.email,
        phone: orderData.buyer.phoneNumber
      } : null,
      shipping_address: orderData?.shippingAddress,
      order_number: orderData?.orderNumber,
      created_at: orderData?.createdAt,
      items: orderData?.items,
      delivered_at: orderData?.deliveredAt,
      shipped_at: orderData?.shippedAt,
      source: 'api_fallback'
    };
    
    return NextResponse.json(trackingData);
    
  } catch (error) {
    console.error('Error in fallbackToAllTrackings:', error);
    
    // If we have an order but no API data, create a basic tracking record
    if (order) {
      return createBasicTrackingResponse(trackingNumber, order);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch tracking details', success: false },
      { status: 500 }
    );
  }
}

// Helper function to create a basic tracking response from order data
function createBasicTrackingResponse(trackingNumber: string, order: unknown) {
  const orderData = order as OrderData;
  
  let checkpoints = [];
  
  // Use order tracking history if available
  if (orderData.trackingHistory && Array.isArray(orderData.trackingHistory)) {
    checkpoints = orderData.trackingHistory.map((checkpoint: unknown) => {
      const cp = checkpoint as Record<string, unknown>;
      return {
        date: cp.checkpointTime,
        location: cp.location as string || '',
        message: cp.details as string || cp.status as string,
        status: cp.status as string
      };
    });
  } else {
    // Create an initial checkpoint
    checkpoints = [{
      date: orderData.createdAt,
      location: '',
      message: 'Order created',
      status: 'info_received'
    }];
    
    // Add shipped checkpoint if applicable
    if (orderData.shippedAt) {
      checkpoints.push({
        date: orderData.shippedAt,
        location: '',
        message: 'Order shipped',
        status: 'in_transit'
      });
    }
    
    // Add delivered checkpoint if applicable
    if (orderData.deliveredAt) {
      checkpoints.push({
        date: orderData.deliveredAt,
        location: '',
        message: 'Order delivered',
        status: 'delivered'
      });
    }
    
    // Sort checkpoints by date (newest first)
    checkpoints.sort((a: unknown, b: unknown) => {
      const aDate = (a as Record<string, unknown>).date as Date;
      const bDate = (b as Record<string, unknown>).date as Date;
      return bDate.getTime() - aDate.getTime();
    });
  }
  
  return NextResponse.json({
    success: true,
    tracking_number: trackingNumber,
    courier_code: orderData.courierCode || 'unknown',
    courier_name: orderData.courierName || 'Unknown Courier',
    status: orderData.status,
    detailed_status: orderData.detailedTrackingStatus || 'Processing',
    checkpoints: checkpoints,
    customer: orderData.buyer ? {
      name: orderData.buyer.fullName,
      email: orderData.buyer.email,
      phone: orderData.buyer.phoneNumber
    } : null,
    shipping_address: orderData.shippingAddress,
    order_number: orderData.orderNumber,
    created_at: orderData.createdAt,
    items: orderData.items,
    delivered_at: orderData.deliveredAt,
    shipped_at: orderData.shippedAt,
    source: 'database_fallback'
  });
} 