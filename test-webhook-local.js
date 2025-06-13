// Import fetch with CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWebhookLocal() {
  try {
    console.log('Testing webhook endpoint locally...');
    const webhookUrl = 'http://localhost:3000/api/webhook/stripe';
    
    // Simulate a checkout.session.completed event
    const mockEvent = {
      id: 'evt_test_123456',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_mock_session_id',
          object: 'checkout.session',
          payment_status: 'paid',
          status: 'complete',
          metadata: {
            orderIds: '9' // Use an order ID that exists in your database
          },
          customer_details: {
            email: 'test@example.com',
            name: 'Test User'
          },
          amount_total: 4829
        }
      },
      type: 'checkout.session.completed'
    };
    
    // Make a POST request to the webhook endpoint
    console.log('Sending mock event to webhook...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature' // This will fail signature verification but test routing
      },
      body: JSON.stringify(mockEvent)
    });

    const responseData = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseData);
    
    console.log('\nNow checking environment variables...');
    const envResponse = await fetch('http://localhost:3000/api/env-check');
    const envData = await envResponse.json();
    console.log('Environment variables status:');
    console.log(JSON.stringify(envData, null, 2));
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhookLocal(); 