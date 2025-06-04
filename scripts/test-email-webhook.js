const fetch = require('node-fetch');
require('dotenv').config();

async function testEmailWebhook() {
  try {
    console.log('Testing webhook with email sending...');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/webhook/stripe/test`; // Use the test endpoint
    
    // Get order ID from command line
    const orderId = process.argv[2];
    if (!orderId) {
      console.error('Please provide an order ID: node test-email-webhook.js <orderId>');
      process.exit(1);
    }
    
    // Simulate a checkout.session.completed event
    const mockEvent = {
      id: 'evt_test_email_' + Date.now(),
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_' + Date.now(),
          object: 'checkout.session',
          payment_status: 'paid',
          status: 'complete',
          metadata: {
            orderIds: orderId // Use the provided order ID
          },
          customer_details: {
            email: 'test@example.com',
            name: 'Test User'
          },
          amount_total: 9999
        }
      },
      type: 'checkout.session.completed'
    };
    
    // Make a POST request to the webhook endpoint
    console.log(`Sending mock event to test webhook at ${webhookUrl}...`);
    console.log(`Using order ID: ${orderId}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockEvent)
    });

    const responseData = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseData);
    
    console.log('\nCheck the server logs to see if the email was sent successfully.');
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testEmailWebhook(); 