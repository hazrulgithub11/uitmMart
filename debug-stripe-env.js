// Script to debug Stripe environment and webhook setup
require('dotenv').config();
const Stripe = require('stripe');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Initialize Stripe if possible
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
  }
} catch (error) {
  console.error(`${colors.red}Error initializing Stripe:${colors.reset}`, error.message);
}

async function debugStripeEnvironment() {
  console.log(`\n${colors.cyan}=== Stripe Environment Check ===${colors.reset}\n`);
  
  // Check environment variables
  const envVars = {
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY ? 
      `${colors.green}✅ Set${colors.reset}` : 
      `${colors.red}❌ Missing${colors.reset}`,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET ? 
      `${colors.green}✅ Set${colors.reset}` : 
      `${colors.red}❌ Missing${colors.reset}`,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL ? 
      `${colors.green}✅ Set: ${process.env.NEXT_PUBLIC_APP_URL}${colors.reset}` : 
      `${colors.red}❌ Missing${colors.reset}`,
    'NEXT_PUBLIC_BASE_URL': process.env.NEXT_PUBLIC_BASE_URL ? 
      `${colors.green}✅ Set: ${process.env.NEXT_PUBLIC_BASE_URL}${colors.reset}` : 
      `${colors.red}❌ Missing${colors.reset}`,
  };
  
  console.log('Environment Variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // Check actual URL that would be used
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXT_PUBLIC_BASE_URL || 
                 'http://localhost:3000';
  
  console.log(`\nDetected Base URL: ${colors.cyan}${baseUrl}${colors.reset}`);
  console.log(`Webhook Endpoint: ${colors.cyan}${baseUrl}/api/webhook/stripe${colors.reset}`);

  // If Stripe was initialized, check webhook endpoints
  if (stripe) {
    try {
      console.log(`\n${colors.magenta}Checking Stripe webhook endpoints...${colors.reset}`);
      const webhooks = await stripe.webhookEndpoints.list();
      
      if (webhooks.data.length === 0) {
        console.log(`${colors.yellow}No webhook endpoints configured in Stripe.${colors.reset}`);
        console.log(`Use the Stripe CLI command below to forward webhook events:`);
        console.log(`${colors.cyan}stripe listen --forward-to ${baseUrl}/api/webhook/stripe${colors.reset}`);
      } else {
        console.log(`Found ${webhooks.data.length} webhook endpoints:`);
        webhooks.data.forEach(webhook => {
          const status = webhook.status === 'enabled' ? 
            `${colors.green}Enabled${colors.reset}` : 
            `${colors.red}Disabled${colors.reset}`;
          
          console.log(`  - URL: ${colors.cyan}${webhook.url}${colors.reset}`);
          console.log(`    Status: ${status}`);
          console.log(`    Events: ${webhook.enabled_events.join(', ')}`);
        });
      }
    } catch (error) {
      console.error(`${colors.red}Error fetching webhook endpoints:${colors.reset}`, error.message);
    }
  }
  
  console.log(`\n${colors.cyan}=== Stripe Environment Check Complete ===${colors.reset}\n`);
}

// Main function
async function main() {
  await debugStripeEnvironment();
  
  // Add recommendations based on what we found
  console.log(`${colors.yellow}Recommendations:${colors.reset}`);
  console.log(`1. ${colors.green}Make sure both NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_BASE_URL point to the same URL${colors.reset}`);
  console.log(`2. ${colors.green}Ensure STRIPE_WEBHOOK_SECRET is properly set from your Stripe Dashboard${colors.reset}`);
  console.log(`3. ${colors.green}When testing locally, use the Stripe CLI to forward events:${colors.reset}`);
  console.log(`   ${colors.cyan}stripe listen --forward-to http://localhost:3000/api/webhook/stripe${colors.reset}`);
  console.log(`4. ${colors.green}Check that you have enabled the 'checkout.session.completed' event in your webhook configuration${colors.reset}`);
}

main()
  .catch(error => {
    console.error(`${colors.red}Error during debug process:${colors.reset}`, error);
  })
  .finally(() => {
    console.log('Finished debugging.');
  }); 