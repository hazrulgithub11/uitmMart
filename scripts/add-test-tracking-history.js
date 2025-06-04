// Script to add test tracking history records directly to the database
// Usage: node -r dotenv/config scripts/add-test-tracking-history.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting test tracking history generation script...');
  
  // Replace with the orderId you want to add tracking history to
  const orderId = 15; // Change this to your actual order ID
  
  // Get the order to make sure it exists and has a tracking number
  try {
    const order = await prisma.$queryRaw`
      SELECT id, "trackingNumber", "courierCode" FROM "Order" WHERE id = ${orderId}
    `;
    
    if (!order || order.length === 0) {
      console.error(`Order with ID ${orderId} not found!`);
      return;
    }
    
    const trackingNumber = order[0].trackingNumber;
    const courierCode = order[0].courierCode;
    
    console.log(`Found order ${orderId} with tracking number ${trackingNumber} and courier code ${courierCode}`);
    
    // Sample checkpoint data similar to tracking.my API
    const checkpoints = [
      {
        time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        status: 'info_received',
        content: 'Picked Up',
        location: 'Kuala Lumpur Sorting Center'
      },
      {
        time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        status: 'in_transit',
        content: 'Outbound',
        location: 'Kuala Lumpur Transit Center'
      },
      {
        time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'in_transit',
        content: 'Inbound',
        location: 'Shah Alam Distribution Center'
      },
      {
        time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        status: 'out_for_delivery',
        content: 'Out for Delivery',
        location: 'Local Distribution Center'
      },
      {
        time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'delivered',
        content: 'Delivered',
        location: 'Recipient Address'
      }
    ];
    
    // Insert each checkpoint as a tracking history record
    for (const checkpoint of checkpoints) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "TrackingHistory" (
            "id", "orderId", "trackingNumber", "status", "details", "location", 
            "checkpointTime", "rawData", "createdAt"
          )
          VALUES (
            gen_random_uuid(), ${orderId}, ${trackingNumber}, ${checkpoint.status}, 
            ${checkpoint.content}, ${checkpoint.location}, ${new Date(checkpoint.time)}, 
            ${JSON.stringify(checkpoint)}::jsonb, NOW()
          )
          ON CONFLICT ("orderId", "trackingNumber", "checkpointTime", "details") DO NOTHING
        `;
        
        console.log(`Added checkpoint: ${checkpoint.content} at ${checkpoint.time}`);
      } catch (error) {
        console.error(`Error adding checkpoint ${checkpoint.content}:`, error);
      }
    }
    
    console.log(`Successfully added ${checkpoints.length} tracking history records for order ${orderId}`);
    
    // Also update the order status to match the latest checkpoint
    await prisma.$executeRaw`
      UPDATE "Order" SET "status" = 'delivered', "deliveredAt" = NOW()
      WHERE id = ${orderId}
    `;
    
    console.log(`Updated order ${orderId} status to delivered`);
    
  } catch (error) {
    console.error('Error in script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Script completed successfully'))
  .catch(e => {
    console.error('Script failed:', e);
    process.exit(1);
  }); 