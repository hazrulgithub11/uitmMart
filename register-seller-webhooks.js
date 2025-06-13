// Script to register webhooks for all existing connected accounts
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Function to register a webhook for a connected account
async function registerWebhookForAccount(accountId, shopName) {
  try {
    console.log(`Registering webhook for ${shopName} (${accountId})...`);
    
    // First check if a webhook already exists
    const existingWebhooks = await stripe.webhookEndpoints.list(
      { limit: 100 },
      { stripeAccount: accountId }
    );
    
    // Check if we already have a webhook pointing to our endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   'http://localhost:3000';
    const endpointUrl = `${baseUrl}/api/webhook/stripe`;
    
    const existingWebhook = existingWebhooks.data.find(webhook => 
      webhook.url === endpointUrl
    );
    
    if (existingWebhook) {
      console.log(`Webhook already exists for ${shopName}: ${existingWebhook.id}`);
      return {
        success: true,
        message: 'Webhook already exists',
        webhookId: existingWebhook.id
      };
    }
    
    // Create a new webhook
    const webhook = await stripe.webhookEndpoints.create({
      url: endpointUrl,
      enabled_events: [
        'checkout.session.completed',
        'payment_intent.succeeded',
        'payment_intent.payment_failed'
      ],
      api_version: '2023-10-16',
      description: `Webhook for UitmMart Seller: ${shopName}`
    }, {
      stripeAccount: accountId
    });
    
    console.log(`Successfully registered webhook for ${shopName}: ${webhook.id}`);
    return {
      success: true,
      message: 'Webhook created successfully',
      webhookId: webhook.id
    };
  } catch (error) {
    console.error(`Error registering webhook for ${shopName}:`, error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

// Main function to process all shops
async function registerAllWebhooks() {
  try {
    console.log('Fetching all shops with Stripe accounts...');
    
    // Get all shops that have a Stripe account ID
    const shops = await prisma.shop.findMany({
      where: {
        stripeAccountId: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        stripeAccountId: true,
        seller: {
          select: {
            email: true
          }
        }
      }
    });
    
    console.log(`Found ${shops.length} shops with Stripe accounts`);
    
    if (shops.length === 0) {
      console.log('No shops found with Stripe accounts. Exiting...');
      return;
    }
    
    // Process each shop
    const results = [];
    for (const shop of shops) {
      console.log(`\nProcessing shop: ${shop.name} (ID: ${shop.id})`);
      
      if (!shop.stripeAccountId) {
        console.log(`Shop ${shop.name} has no Stripe account ID. Skipping...`);
        results.push({
          shopId: shop.id,
          shopName: shop.name,
          success: false,
          message: 'No Stripe account ID'
        });
        continue;
      }
      
      // Register the webhook
      const result = await registerWebhookForAccount(
        shop.stripeAccountId, 
        shop.name
      );
      
      results.push({
        shopId: shop.id,
        shopName: shop.name,
        sellerEmail: shop.seller?.email,
        stripeAccountId: shop.stripeAccountId,
        ...result
      });
    }
    
    // Print summary
    console.log('\n=== WEBHOOK REGISTRATION SUMMARY ===');
    console.log(`Total shops processed: ${shops.length}`);
    console.log(`Successful registrations: ${results.filter(r => r.success).length}`);
    console.log(`Failed registrations: ${results.filter(r => !r.success).length}`);
    
    return results;
  } catch (error) {
    console.error('Error processing shops:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
registerAllWebhooks()
  .then(results => {
    console.log('\nAll done!');
  })
  .catch(error => {
    console.error('Script error:', error);
  }); 