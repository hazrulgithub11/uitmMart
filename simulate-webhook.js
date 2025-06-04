// Script to simulate Stripe webhook events
require('dotenv').config();
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const WEBHOOK_URL = 'http://localhost:3000/api/webhook/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to create a signed webhook event
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Send a simulated webhook event to your server
async function sendWebhookEvent(eventType, data) {
  // Create a properly structured Stripe event
  const event = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data
    },
    type: eventType
  };
  
  // Convert to string for signing
  const payload = JSON.stringify(event);
  
  try {
    // Send the webhook request
    console.log(`Sending ${eventType} webhook event...`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Only add signature if webhook secret is available
    if (WEBHOOK_SECRET) {
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);
      headers['stripe-signature'] = signature;
      console.log('Webhook signed with secret');
    } else {
      console.warn('STRIPE_WEBHOOK_SECRET not found. Sending unsigned webhook (will fail verification).');
    }
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: payload
    });
    
    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${responseText}`);
    
    return { success: response.ok, status: response.status, body: responseText };
  } catch (error) {
    console.error('Error sending webhook:', error);
    return { success: false, error: error.message };
  }
}

// Simulate a checkout.session.completed event
async function simulateCheckoutCompleted() {
  // Use order ID 9 from your screenshot
  const sessionData = {
    id: 'cs_test_simulated_session',
    object: 'checkout.session',
    payment_status: 'paid',
    status: 'complete',
    customer_details: {
      email: 'test@example.com',
      name: 'Test Customer'
    },
    amount_total: 4829,
    metadata: {
      orderIds: '9'  // Use an existing order ID from your database
    }
  };
  
  return sendWebhookEvent('checkout.session.completed', sessionData);
}

// Main function to run simulation
async function main() {
  console.log('Starting Stripe webhook simulation...');
  
  // Check env vars
  console.log('\nChecking environment variables:');
  console.log('STRIPE_WEBHOOK_SECRET:', WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
  
  // Run simulation
  console.log('\nSimulating checkout.session.completed event:');
  await simulateCheckoutCompleted();
}

main(); 