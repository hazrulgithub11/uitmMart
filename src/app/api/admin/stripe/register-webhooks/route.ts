import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

// Register a webhook for a connected account
async function registerWebhookForAccount(accountId: string, shopName: string) {
  try {
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
    
    return {
      success: true,
      message: 'Webhook created successfully',
      webhookId: webhook.id
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Admin endpoint to register webhooks for all connected accounts
export async function POST() {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user's role from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Get all shops with Stripe accounts
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
    
    if (shops.length === 0) {
      return NextResponse.json({ 
        message: 'No shops found with Stripe accounts', 
        shops: 0,
        results: [] 
      });
    }
    
    // Process each shop
    const results = [];
    for (const shop of shops) {
      if (!shop.stripeAccountId) continue;
      
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
    
    // Return the results
    return NextResponse.json({
      message: 'Webhook registration complete',
      shops: shops.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
    
  } catch (error: unknown) {
    console.error('Error registering webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to register webhooks', details: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 