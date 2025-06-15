// Test script to send a webhook to your endpoint
const fetch = require('node-fetch');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function sendTestWebhook() {
  try {
    // Get API key from .env.local file
    const apiKey = process.env.TRACKING_MY_API_KEY;
    
    if (!apiKey) {
      console.error('No API key found in environment variables.');
      console.log('Make sure to run this script with:');
      console.log('  npm run test-webhook');
      return;
    }
    
    // Use your ngrok URL or actual domain here
    const webhookUrl = "https://uitmmart.site/api/tracking/webhook";
    console.log('Sending test webhook to:', webhookUrl);
    
    // Create a test webhook payload
    const payload = {
      events: [
        {
          time: Math.floor(Date.now() / 1000),
          event: "trackings/checkpoint_update",
          domain: "uitmmart.com",
          tracking: {
            id: "test-tracking-id-123",
            note: "Test shipment",
            smses: [],
            reason: null,
            status: "delivered", // Overall status
            courier: "jt", // Using 'jt' as in the example
            order_id: "order-xyz-789",
            created_at: "2023-03-20T10:46:30+08:00",
            deleted_at: null,
            short_link: "https://tracking.my/s/testlink",
            updated_at: new Date().toISOString(), // Current time for updated_at
            checkpoints: [
              {
                time: "2023-03-08T14:42:08+08:00",
                status: "delivered",
                content: "Delivered",
                location: "Drop Point PDP AJIL 211 - HULU TERENGGANU"
              },
              {
                time: "2023-03-08T12:21:17+08:00",
                status: "out_for_delivery",
                content: "Delivery",
                location: "Drop Point PDP AJIL 211 - HULU TERENGGANU"
              },
              {
                time: "2023-03-08T11:49:01+08:00",
                status: "in_transit",
                content: "Inbound",
                location: "Drop Point PDP AJIL 211 - HULU TERENGGANU"
              },
              {
                time: "2023-03-07T23:56:10+08:00",
                status: "in_transit",
                content: "Outbound",
                location: "Transit Center TRG GATEWAY - KUALA NERUS"
              },
              {
                time: "2023-03-07T21:31:53+08:00",
                status: "in_transit",
                content: "Inbound",
                location: "Transit Center TRG GATEWAY - KUALA NERUS"
              },
              {
                time: "2023-03-07T17:57:12+08:00",
                status: "in_transit",
                content: "Outbound",
                location: "Drop Point DP PASIR PANJANG 01 - KUALA TERENGGANU"
              },
              {
                time: "2023-03-07T09:15:56+08:00",
                status: "info_received",
                content: "Picked Up",
                location: "Drop Point DP PASIR PANJANG 01 - KUALA TERENGGANU"
              }
            ],
            order_number: "TEST123456789", // Keeping this as a test order number
            parcel_image: null,
            customer_name: "Test User",
            customer_email: "test@example.com",
            customer_phone: "60123456789",
            parcel_content: "Test Item",
            tracking_number: "600527447944", // Using the example tracking number
            latest_checkpoint: { // Adding the latest_checkpoint object
              time: "2023-03-08T14:42:08+08:00",
              status: "delivered",
              content: "Delivered",
              location: "Drop Point PDP AJIL 211 - HULU TERENGGANU"
            }
          }
        }
      ]
    };
    
    // Create the signature using the first 10 characters of the API key as the secret
    const secret = apiKey.substring(0, 10);
    console.log('Using secret key for signature:', secret);
    
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('base64');
    
    console.log('Generated HMAC signature:', signature);
    
    // Send the webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Tracking-Hmac-Sha256': signature
      },
      body: payloadString
    });
    
    const responseText = await response.text();
    
    console.log('\n===== WEBHOOK RESPONSE =====');
    console.log('Status:', response.status, response.statusText);
    
    try {
      // Parse as JSON if possible
      const data = JSON.parse(responseText);
      console.log('Response data:', data);
    } catch (error) {
      console.log('Raw response:', responseText);
    }
  } catch (error) {
    console.error('Error sending test webhook:', error);
  }
}

console.log('Starting webhook test...');
sendTestWebhook()
  .then(() => console.log('\nTest completed.'))
  .catch(err => console.error('Unhandled error:', err)); 