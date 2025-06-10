// Debug script to test webhook registration and reveal the full secret key
// IMPORTANT: For development use only - never log secrets in production

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testWebhookRegistration() {
  try {
    // Get API key from .env.local file
    const apiKey = process.env.TRACKING_MY_API_KEY;
    
    if (!apiKey) {
      console.error('No API key found in environment variables.');
      console.log('Make sure to run this script with:');
      console.log('  npm run debug-webhook');
      return;
    }
    
    console.log('Using API key:', apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3));
    
    // Use your ngrok URL or actual domain here
    const webhookUrl = "https://f66e-2001-d08-e1-1268-b15d-8c18-a27f-6f81.ngrok-free.app/api/tracking/webhook";
    console.log('Registering webhook at:', webhookUrl);
    
    // Register the webhook directly with tracking.my
    const response = await fetch('https://seller.tracking.my/api/v2/webhook', {
      method: 'PUT',
      headers: {
        'Tracking-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: [
          "trackings/create", 
          "trackings/update", 
          "trackings/checkpoint_update"
        ],
        secret_key: apiKey.substring(0, 10) // We use part of the API key as a secret
      }),
    });
    
    const responseText = await response.text();
    
    try {
      // Parse as JSON if possible
      const data = JSON.parse(responseText);
      
      console.log('\n===== WEBHOOK REGISTRATION RESPONSE =====');
      console.log('Status:', response.status, response.statusText);
      
      if (data.webhook) {
        console.log('\n✅ WEBHOOK REGISTERED SUCCESSFULLY');
        console.log('URL:', data.webhook.url);
        console.log('Events:', data.webhook.events);
        console.log('Secret Key:', data.webhook.secret_key, '(FULL VALUE)');
        
        // Store this secret key for HMAC verification of incoming webhooks
        console.log('\nIMPORTANT: Use this secret key for verifying webhook signatures.');
        console.log('Store it securely and do not expose it in client-side code.');
      } else {
        console.log('\n❌ WEBHOOK REGISTRATION FAILED');
        console.log('Response data:', data);
      }
    } catch (error) {
      console.log('\n❌ FAILED TO PARSE RESPONSE');
      console.log('Raw response:', responseText);
    }
  } catch (error) {
    console.error('Error during webhook registration:', error);
  }
}

console.log('Starting webhook registration test...');
testWebhookRegistration()
  .then(() => console.log('\nTest completed.'))
  .catch(err => console.error('Unhandled error:', err)); 