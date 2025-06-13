/**
 * Tracking API Test Script
 * Run with: node src/scripts/test-tracking.js <tracking_number> <courier_code>
 * 
 * This script helps debug tracking integration issues by:
 * 1. Testing direct API calls to tracking.my
 * 2. Checking database connectivity
 * 3. Simulating the tracking history creation process
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// Get tracking number and courier code from command line arguments
const trackingNumber = process.argv[2];
const courierCode = process.argv[3] || 'shopee';

if (!trackingNumber) {
  console.error('Usage: node test-tracking.js <tracking_number> [courier_code]');
  process.exit(1);
}

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

async function main() {
  console.log('='.repeat(70));
  console.log(`TRACKING TEST: ${trackingNumber} (Courier: ${courierCode})`);
  console.log('='.repeat(70));
  
  // Step 1: Test database connectivity
  console.log('\n1. Testing Database Connectivity...');
  try {
    const count = await prisma.$queryRaw`SELECT COUNT(*) FROM "Order"`;
    console.log('✅ Database connection successful');
    console.log(`Orders in database: ${count[0].count}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  
  // Step 2: Check if order with tracking number exists
  console.log('\n2. Checking for Order with Tracking Number...');
  try {
    const orders = await prisma.$queryRaw`
      SELECT id, status FROM "Order" 
      WHERE "trackingNumber" = ${trackingNumber}
      LIMIT 1
    `;
    
    if (orders && orders.length > 0) {
      const order = orders[0];
      console.log(`✅ Found order: ID ${order.id}, Status: ${order.status}`);
      
      // Check for existing tracking history
      const history = await prisma.$queryRaw`
        SELECT COUNT(*) FROM "TrackingHistory"
        WHERE "orderId" = ${order.id}
      `;
      
      console.log(`Existing tracking history records: ${history[0].count}`);
    } else {
      console.log('⚠️ No order found with this tracking number');
      console.log('Creating a test order with this tracking number...');
      
      // Create a test order with this tracking number
      try {
        await prisma.$executeRaw`
          INSERT INTO "Order" (
            "id", "userId", "orderNumber", "totalAmount", "status", 
            "paymentStatus", "trackingNumber", "courierCode", "createdAt", "updatedAt"
          )
          VALUES (
            nextval('"Order_id_seq"'), 1, ${'TEST-' + Math.floor(Math.random() * 10000)}, 
            100, 'processing', 'paid', ${trackingNumber}, ${courierCode}, 
            NOW(), NOW()
          )
          RETURNING id
        `;
        console.log(`✅ Created test order with tracking number ${trackingNumber}`);
      } catch (createErr) {
        console.error('❌ Failed to create test order:', createErr.message);
      }
    }
  } catch (err) {
    console.error('❌ Error checking for order:', err.message);
  }
  
  // Step 3: Test direct API call to tracking.my
  console.log('\n3. Testing Direct API Call to tracking.my...');
  
  const apiKey = process.env.TRACKING_MY_API_KEY;
  if (!apiKey) {
    console.error('❌ No API key found in .env file (TRACKING_MY_API_KEY)');
    process.exit(1);
  }
  
  try {
    // First try the direct courier endpoint
    const trackingUrl = `https://seller.tracking.my/api/v1/trackings/${courierCode}/${trackingNumber}`;
    console.log(`Making API request to: ${trackingUrl}`);
    
    const response = await fetch(trackingUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Tracking-Api-Key': apiKey
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      console.log('❌ Direct endpoint failed, trying general endpoint...');
      
      // Try the general tracking endpoint
      const fallbackUrl = `https://seller.tracking.my/api/v1/trackings/${trackingNumber}`;
      console.log(`Making API request to: ${fallbackUrl}`);
      
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Tracking-Api-Key': apiKey
        }
      });
      
      console.log(`Fallback response status: ${fallbackResponse.status}`);
      
      if (!fallbackResponse.ok) {
        console.log('❌ Fallback endpoint failed, trying all trackings endpoint...');
        
        // Try the all trackings endpoint as a last resort
        const allTrackingsUrl = 'https://seller.tracking.my/api/v1/trackings';
        console.log(`Making API request to: ${allTrackingsUrl}`);
        
        const allTrackingsResponse = await fetch(allTrackingsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Tracking-Api-Key': apiKey
          }
        });
        
        if (!allTrackingsResponse.ok) {
          console.error('❌ All endpoints failed');
          return;
        }
        
        const allTrackingsData = await allTrackingsResponse.json();
        console.log(`All trackings response has ${Object.keys(allTrackingsData).join(', ')} keys`);
        
        // Check the structure of the response
        if (allTrackingsData.trackings && Array.isArray(allTrackingsData.trackings)) {
          const trackings = allTrackingsData.trackings;
          console.log(`Found ${trackings.length} trackings`);
          
          const matching = trackings.find(t => 
            t.tracking_number === trackingNumber || 
            t.trackingNumber === trackingNumber
          );
          
          if (matching) {
            console.log('✅ Found matching tracking in all trackings response');
            console.log(`Status: ${matching.status}`);
            console.log(`Created at: ${matching.created_at}`);
            
            if (matching.latest_checkpoint) {
              console.log(`Latest checkpoint: ${matching.latest_checkpoint.status} (${matching.latest_checkpoint.time})`);
            }
            
            // Try to fetch full tracking details if we have courier information
            if (matching.courier) {
              console.log(`\nAttempting to fetch full tracking details for courier: ${matching.courier}`);
              
              const detailsUrl = `https://seller.tracking.my/api/v1/trackings/${matching.courier}/${trackingNumber}`;
              const detailsResponse = await fetch(detailsUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Tracking-Api-Key': apiKey
                }
              });
              
              console.log(`Details API response status: ${detailsResponse.status}`);
              
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                console.log('✅ Successfully retrieved full tracking details');
                
                if (detailsData.data && detailsData.data.checkpoints) {
                  const checkpoints = detailsData.data.checkpoints;
                  console.log(`Found ${checkpoints.length} checkpoints`);
                  
                  if (checkpoints.length > 0) {
                    console.log('\nCheckpoint details:');
                    checkpoints.forEach((checkpoint, index) => {
                      const time = new Date(checkpoint.checkpoint_time || checkpoint.time || checkpoint.created_at || '');
                      console.log(`${index + 1}. [${time.toLocaleString()}] ${checkpoint.message || checkpoint.status || 'Status update'} - ${checkpoint.location || 'Unknown'}`);
                    });
                  }
                  
                  // Test creating tracking history records
                  await createTrackingHistoryRecords({ checkpoints });
                } 
                // Handle tracking data format
                else if (detailsData.tracking) {
                  console.log('✅ Found tracking object in details response');
                  
                  if (detailsData.tracking.latest_checkpoint) {
                    console.log(`Latest checkpoint: ${detailsData.tracking.latest_checkpoint.status} (${detailsData.tracking.latest_checkpoint.time})`);
                    
                    // Create tracking record from latest_checkpoint
                    const latestCP = detailsData.tracking.latest_checkpoint;
                    const checkpoints = [{
                      checkpoint_time: latestCP.time,
                      status: latestCP.status,
                      message: latestCP.content || latestCP.status,
                      location: latestCP.location || ''
                    }];
                    
                    console.log('\nCheckpoint details:');
                    const time = new Date(latestCP.time || '');
                    console.log(`1. [${time.toLocaleString()}] ${latestCP.content || latestCP.status} - ${latestCP.location || 'Unknown'}`);
                    
                    // Test creating tracking history records
                    await createTrackingHistoryRecords({ checkpoints });
                  } else {
                    console.log('❌ No checkpoints or latest_checkpoint found in tracking details');
                  }
                } else {
                  console.log('❌ No checkpoints found in full tracking details');
                }
              } else {
                console.log('❌ Failed to fetch full tracking details');
              }
            }
            
            // Test creating a tracking history record
            await createTrackingHistoryRecord(matching);
          } else {
            console.log('❌ No matching tracking found in all trackings response');
            
            // Create an initial tracking record anyway
            await createInitialTrackingRecord();
          }
        } else {
          console.error('❌ Unexpected response format for all trackings endpoint');
          console.log('Response keys:', Object.keys(allTrackingsData));
        }
      } else {
        const fallbackData = await fallbackResponse.json();
        console.log('✅ Fallback endpoint successful');
        
        if (fallbackData.data) {
          console.log(`Status: ${fallbackData.data.status || fallbackData.data.delivery_status}`);
          console.log(`Courier: ${fallbackData.data.courier?.name || fallbackData.data.courier?.code || fallbackData.data.courier}`);
          
          if (fallbackData.data.checkpoints && fallbackData.data.checkpoints.length) {
            console.log(`Checkpoints: ${fallbackData.data.checkpoints.length}`);
            console.log(`Latest: ${fallbackData.data.checkpoints[0].status} (${fallbackData.data.checkpoints[0].checkpoint_time})`);
            
            console.log('\nCheckpoint details:');
            fallbackData.data.checkpoints.forEach((checkpoint, index) => {
              const time = new Date(checkpoint.checkpoint_time || checkpoint.time || checkpoint.created_at || '');
              console.log(`${index + 1}. [${time.toLocaleString()}] ${checkpoint.message || checkpoint.status || 'Status update'} - ${checkpoint.location || 'Unknown'}`);
            });
          }
          
          // Test creating tracking history records for each checkpoint
          await createTrackingHistoryRecords(fallbackData.data);
        } else {
          console.log('❌ No data in fallback response');
        }
      }
    } else {
      const data = await response.json();
      console.log('✅ Direct endpoint successful');
      
      // Handle tracking-based response format
      if (data.tracking) {
        console.log(`Status: ${data.tracking.status || 'Unknown'}`);
        console.log(`Courier: ${data.tracking.courier}`);
        
        // Handle latest_checkpoint case
        if (data.tracking.latest_checkpoint) {
          console.log('Found latest_checkpoint in tracking response');
          const latestCP = data.tracking.latest_checkpoint;
          console.log(`Latest checkpoint: ${latestCP.status} (${latestCP.time})`);
          console.log(`Location: ${latestCP.location || 'Unknown'}`);
          console.log(`Content: ${latestCP.content || 'No content'}`);
          
          // Create a checkpoint array for processing
          const checkpoints = [{
            checkpoint_time: latestCP.time,
            status: latestCP.status,
            message: latestCP.content || latestCP.status,
            location: latestCP.location || ''
          }];
          
          // Test creating tracking history records
          await createTrackingHistoryRecords({ checkpoints });
        }
        
        // Handle checkpoints array case
        else if (data.tracking.checkpoints && Array.isArray(data.tracking.checkpoints) && data.tracking.checkpoints.length > 0) {
          console.log(`Checkpoints: ${data.tracking.checkpoints.length}`);
          console.log(`Latest: ${data.tracking.checkpoints[0].status} (${data.tracking.checkpoints[0].checkpoint_time})`);
          
          console.log('\nCheckpoint details:');
          data.tracking.checkpoints.forEach((checkpoint, index) => {
            const time = new Date(checkpoint.checkpoint_time || checkpoint.time || checkpoint.created_at || '');
            console.log(`${index + 1}. [${time.toLocaleString()}] ${checkpoint.message || checkpoint.status || 'Status update'} - ${checkpoint.location || 'Unknown'}`);
          });
          
          // Test creating tracking history records
          await createTrackingHistoryRecords({ checkpoints: data.tracking.checkpoints });
        }
        
        // Handle no checkpoints case
        else {
          console.log('No checkpoints found in tracking data');
          
          // Create an initial tracking record
          await createInitialTrackingRecord();
        }
      }
      // Handle data-based response format
      else if (data.data) {
        console.log(`Status: ${data.data.status || data.data.delivery_status}`);
        console.log(`Courier: ${data.data.courier?.name || data.data.courier?.code || data.data.courier}`);
        
        if (data.data.checkpoints && data.data.checkpoints.length) {
          console.log(`Checkpoints: ${data.data.checkpoints.length}`);
          console.log(`Latest: ${data.data.checkpoints[0].status} (${data.data.checkpoints[0].checkpoint_time})`);
          
          console.log('\nCheckpoint details:');
          data.data.checkpoints.forEach((checkpoint, index) => {
            const time = new Date(checkpoint.checkpoint_time || checkpoint.time || checkpoint.created_at || '');
            console.log(`${index + 1}. [${time.toLocaleString()}] ${checkpoint.message || checkpoint.status || 'Status update'} - ${checkpoint.location || 'Unknown'}`);
          });
        }
        
        // Test creating tracking history records for each checkpoint
        await createTrackingHistoryRecords(data.data);
      } else if (data.tracking && data.tracking.checkpoints) {
        // Alternative format sometimes returned by tracking.my
        console.log(`Status: ${data.tracking.status || data.tracking.delivery_status}`);
        console.log(`Courier: ${data.tracking.courier?.name || data.tracking.courier?.code || data.tracking.courier}`);
        
        if (data.tracking.checkpoints.length) {
          console.log(`Checkpoints: ${data.tracking.checkpoints.length}`);
          console.log(`Latest: ${data.tracking.checkpoints[0].status} (${data.tracking.checkpoints[0].checkpoint_time})`);
          
          console.log('\nCheckpoint details:');
          data.tracking.checkpoints.forEach((checkpoint, index) => {
            const time = new Date(checkpoint.checkpoint_time || checkpoint.time || checkpoint.created_at || '');
            console.log(`${index + 1}. [${time.toLocaleString()}] ${checkpoint.message || checkpoint.status || 'Status update'} - ${checkpoint.location || 'Unknown'}`);
          });
        }
        
        // Test creating tracking history records for each checkpoint
        await createTrackingHistoryRecords(data.tracking);
      } else {
        console.log('❌ No data in response');
        console.log('Raw response structure:', Object.keys(data));
      }
    }
  } catch (err) {
    console.error('❌ Error making API request:', err.message);
  }
}

// Helper function to create tracking history records for each checkpoint
async function createTrackingHistoryRecords(trackingData) {
  console.log('\n4. Testing Tracking History Creation...');
  
  try {
    // Find order with this tracking number
    const orders = await prisma.$queryRaw`
      SELECT id FROM "Order" 
      WHERE "trackingNumber" = ${trackingNumber}
      LIMIT 1
    `;
    
    if (!orders || orders.length === 0) {
      console.log('❌ No order found to create tracking history');
      return;
    }
    
    const orderId = orders[0].id;
    console.log(`Found order ${orderId} for tracking number ${trackingNumber}`);
    
    const checkpoints = trackingData.checkpoints || [];
    if (checkpoints.length === 0) {
      console.log('⚠️ No checkpoints found, creating initial tracking record');
      await createInitialTrackingRecord(orderId);
      return;
    }
    
    console.log(`Processing ${checkpoints.length} checkpoints...`);
    
    // Process each checkpoint
    for (const checkpoint of checkpoints) {
      const checkpointTime = new Date(checkpoint.checkpoint_time || checkpoint.created_at || checkpoint.time || new Date());
      const checkpointStatus = checkpoint.status || checkpoint.slug || 'unknown';
      const checkpointDetails = checkpoint.message || checkpoint.content || checkpoint.description || checkpoint.status || 'Status update';
      const checkpointLocation = checkpoint.location || '';
      
      try {
        // Use raw query to add the checkpoint to the TrackingHistory table
        await prisma.$executeRaw`
          INSERT INTO "TrackingHistory" (
            "id", "orderId", "trackingNumber", "status", "details", "location", 
            "checkpointTime", "rawData", "createdAt"
          )
          VALUES (
            gen_random_uuid(), ${orderId}, ${trackingNumber}, ${checkpointStatus}, 
            ${checkpointDetails}, ${checkpointLocation}, ${checkpointTime}, 
            ${JSON.stringify(checkpoint)}::jsonb, NOW()
          )
          ON CONFLICT ("orderId", "trackingNumber", "checkpointTime", "details") DO NOTHING
        `;
        
        console.log(`✅ Added checkpoint: ${checkpointDetails} at ${checkpointTime.toISOString()}`);
      } catch (error) {
        console.error(`❌ Error adding checkpoint: ${error.message}`);
      }
    }
    
    // Update order status based on latest checkpoint
    if (checkpoints.length > 0) {
      const latestCheckpoint = checkpoints[0];
      const detailedStatus = latestCheckpoint.message || latestCheckpoint.status || 'Processing';
      
      // Map detailed status to main status
      let mainStatus = 'processing'; // Default status
      for (const [detailStatus, mainStatusValue] of Object.entries(statusMapping)) {
        if (detailedStatus.toLowerCase().includes(detailStatus.toLowerCase())) {
          mainStatus = mainStatusValue;
          break;
        }
      }
      
      console.log(`Updating order status to ${mainStatus} (${detailedStatus})`);
      
      try {
        await prisma.$executeRaw`
          UPDATE "Order" 
          SET status = ${mainStatus}, 
              "detailedTrackingStatus" = ${detailedStatus}
          WHERE id = ${orderId}
        `;
        console.log(`✅ Updated order ${orderId} status to ${mainStatus}`);
      } catch (error) {
        console.error(`❌ Error updating order status: ${error.message}`);
      }
    }
    
    // Count total tracking history records for this order
    const historyCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "TrackingHistory"
      WHERE "orderId" = ${orderId}
    `;
    
    console.log(`Total tracking history records for order ${orderId}: ${historyCount[0].count}`);
    
  } catch (err) {
    console.error('❌ Error creating tracking history records:', err.message);
  }
}

// Helper function to create a single tracking history record from an all trackings API response
async function createTrackingHistoryRecord(tracking) {
  try {
    // Find order with this tracking number
    const orders = await prisma.$queryRaw`
      SELECT id FROM "Order" 
      WHERE "trackingNumber" = ${trackingNumber}
      LIMIT 1
    `;
    
    if (!orders || orders.length === 0) {
      console.log('❌ No order found to create tracking history');
      return;
    }
    
    const orderId = orders[0].id;
    console.log(`Found order ${orderId} for tracking number ${trackingNumber}`);
    
    // Create a checkpoint from the latest_checkpoint or tracking itself
    const checkpoint = tracking.latest_checkpoint || {
      status: tracking.status || 'info_received',
      message: `Package status: ${tracking.status || 'Information Received'}`,
      time: tracking.created_at || tracking.updated_at || new Date().toISOString(),
      location: ''
    };
    
    const checkpointTime = new Date(checkpoint.time || checkpoint.created_at || new Date());
    const checkpointStatus = checkpoint.status || 'unknown';
    const checkpointDetails = checkpoint.message || checkpoint.content || checkpoint.description || checkpoint.status || 'Status update';
    const checkpointLocation = checkpoint.location || '';
    
    // Use raw query to add the checkpoint to the TrackingHistory table
    await prisma.$executeRaw`
      INSERT INTO "TrackingHistory" (
        "id", "orderId", "trackingNumber", "status", "details", "location", 
        "checkpointTime", "rawData", "createdAt"
      )
      VALUES (
        gen_random_uuid(), ${orderId}, ${trackingNumber}, ${checkpointStatus}, 
        ${checkpointDetails}, ${checkpointLocation}, ${checkpointTime}, 
        ${JSON.stringify(checkpoint)}::jsonb, NOW()
      )
      ON CONFLICT ("orderId", "trackingNumber", "checkpointTime", "details") DO NOTHING
    `;
    
    console.log(`✅ Added checkpoint from all trackings: ${checkpointDetails} at ${checkpointTime.toISOString()}`);
    
    // Map status to main status
    let mainStatus = 'processing'; // Default status
    for (const [detailStatus, mainStatusValue] of Object.entries(statusMapping)) {
      if (checkpointStatus.toLowerCase().includes(detailStatus.toLowerCase())) {
        mainStatus = mainStatusValue;
        break;
      }
    }
    
    // Update order status
    await prisma.$executeRaw`
      UPDATE "Order" 
      SET status = ${mainStatus}, 
          "detailedTrackingStatus" = ${checkpointStatus}
      WHERE id = ${orderId}
    `;
    
    console.log(`✅ Updated order ${orderId} status to ${mainStatus}`);
    
  } catch (error) {
    console.error(`❌ Error creating tracking history record: ${error.message}`);
  }
}

// Helper function to create an initial tracking record
async function createInitialTrackingRecord(orderId = null) {
  try {
    // If no orderId provided, find the order
    if (!orderId) {
      const orders = await prisma.$queryRaw`
        SELECT id FROM "Order" 
        WHERE "trackingNumber" = ${trackingNumber}
        LIMIT 1
      `;
      
      if (!orders || orders.length === 0) {
        console.log('❌ No order found to create initial tracking record');
        return;
      }
      
      orderId = orders[0].id;
    }
    
    console.log(`Creating initial tracking record for order ${orderId}`);
    
    // Create a basic initial checkpoint
    const now = new Date();
    const initialStatus = 'info_received';
    const initialDetails = 'Shipment information received';
    
    await prisma.$executeRaw`
      INSERT INTO "TrackingHistory" (
        "id", "orderId", "trackingNumber", "status", "details", "location", 
        "checkpointTime", "rawData", "createdAt"
      )
      VALUES (
        gen_random_uuid(), ${orderId}, ${trackingNumber}, ${initialStatus}, 
        ${initialDetails}, '', ${now}, 
        ${{ 
          status: initialStatus, 
          message: initialDetails, 
          time: now.toISOString() 
        }}::jsonb, NOW()
      )
      ON CONFLICT ("orderId", "trackingNumber", "checkpointTime", "details") DO NOTHING
    `;
    
    console.log(`✅ Added initial tracking record for ${trackingNumber} at ${now.toISOString()}`);
    
  } catch (error) {
    console.error(`❌ Error creating initial tracking record: ${error.message}`);
  }
}

// Run the main function
main()
  .catch(e => console.error('Unhandled error:', e))
  .finally(async () => {
    // Close the Prisma client connection
    await prisma.$disconnect();
  }); 