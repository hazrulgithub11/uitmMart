// Import fetch with CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWebhook() {
  try {
    console.log('Testing webhook endpoint...');
    const webhookUrl = 'https://f66e-2001-d08-e1-1268-b15d-8c18-a27f-6f81.ngrok-free.app/api/webhook/stripe';
    
    // Make a simple POST request to the webhook endpoint
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // This will fail signature verification but should reach the endpoint
      },
      body: JSON.stringify({
        type: 'test_event',
        data: {
          object: {
            id: 'test_session',
            metadata: {
              test: true
            }
          }
        }
      })
    });

    const responseData = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseData);
    
    console.log('\nNow checking environment variables...');
    const envResponse = await fetch('https://f66e-2001-d08-e1-1268-b15d-8c18-a27f-6f81.ngrok-free.app/api/env-check');
    const envData = await envResponse.json();
    console.log('Environment variables status:');
    console.log(JSON.stringify(envData, null, 2));
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhook(); 