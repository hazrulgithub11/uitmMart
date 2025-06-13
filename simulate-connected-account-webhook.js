// Script to simulate Stripe webhook events from a connected account
require('dotenv').config();
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration - replace these with your actual values
const WEBHOOK_URL = 'http://localhost:3000/api/webhook/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const CONNECTED_ACCOUNT_ID = 'acct_your_connected_account_id'; // Replace with your connected account ID

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
async function sendConnectedAccountWebhook(eventType, data, connectedAccountId) {
  // Create a properly structured Stripe event
  const event = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data
    },
    type: eventType,
    account: connectedAccountId
  };
  
  // Convert to string for signing
  const payload = JSON.stringify(event);
  
  try {
    // Send the webhook request
    console.log(`Sending ${eventType} webhook event from connected account ${connectedAccountId}...`);
    
    const headers = {
      'Content-Type': 'application/json',
      'stripe-account': connectedAccountId
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

// Simulate a checkout.session.completed event from a connected account
async function simulateConnectedCheckoutCompleted() {
  // Replace order_id with an actual order ID that has the connected account ID set
  const sessionData = {
    id: 'cs_test_connected_simulated_session',
    object: 'checkout.session',
    payment_status: 'paid',
    status: 'complete',
    customer_details: {
      email: 'test@example.com',
      name: 'Test Customer'
    },
    amount_total: 4829,
    metadata: {
      orderIds: '10'  // Replace with an order ID from your connected account
    }
  };
  
  return sendConnectedAccountWebhook('checkout.session.completed', sessionData, CONNECTED_ACCOUNT_ID);
}

// Main function to run simulation
async function main() {
  console.log('Starting Stripe connected account webhook simulation...');
  
  // Check env vars
  console.log('\nChecking environment variables:');
  console.log('STRIPE_WEBHOOK_SECRET:', WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
  console.log('CONNECTED_ACCOUNT_ID:', CONNECTED_ACCOUNT_ID);
  
  // Run simulation
  console.log('\nSimulating checkout.session.completed event from connected account:');
  await simulateConnectedCheckoutCompleted();
}

main(); 