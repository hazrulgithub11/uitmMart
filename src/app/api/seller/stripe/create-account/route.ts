import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Check if we have a Stripe key and log a warning if not
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export async function POST() {
  try {
    console.log('Starting Stripe account creation process');
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', session.user.id);
    
    // Check if the user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true }
    });
    
    if (!user || user.role !== 'seller') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not a seller' },
        { status: 403 }
      );
    }
    
    if (!user.shop) {
      return NextResponse.json(
        { error: 'Seller shop not found' },
        { status: 404 }
      );
    }
    
    console.log('Shop found:', user.shop.id);
    
    // Check if we have a Stripe key
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration error: STRIPE_SECRET_KEY is not defined' },
        { status: 500 }
      );
    }
    
    // Check if the seller already has a Stripe account
    if (user.shop.stripeAccountId) {
      console.log('Existing Stripe account found, creating account link');
      
      // Use either environment variable
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.NEXT_PUBLIC_BASE_URL || 
                     'http://localhost:3000';
      
      // If they do, create an account link to let them update their account
      const accountLink = await stripe.accountLinks.create({
        account: user.shop.stripeAccountId,
        refresh_url: `${baseUrl}/seller/payment?error=true`,
        return_url: `${baseUrl}/seller/payment?success=true`,
        type: 'account_onboarding',
      });
      
      return NextResponse.json({ url: accountLink.url });
    }
    
    console.log('Creating new Stripe account');
    
    // Use either environment variable for base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   'http://localhost:3000';
    
    // Create a new Stripe Connected Account
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'MY', // Malaysia, change as needed
      email: user.email || undefined,
      business_type: 'individual',
      business_profile: {
        name: user.shop.name,
        url: `${baseUrl}/shops/${user.shop.id}`,
      },
      metadata: {
        userId: user.id.toString(),
        shopId: user.shop.id.toString(),
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    console.log('Stripe account created:', account.id);
    
    try {
      // Update the shop with the Stripe account ID
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { 
          stripeAccountId: account.id 
        },
      });
      
      console.log('Shop updated with Stripe account ID');
      
      // Register a webhook for this connected account
      try {
        console.log('Registering webhook for connected account...');
        
        const webhook = await stripe.webhookEndpoints.create({
          url: `${baseUrl}/api/webhook/stripe`,
          enabled_events: [
            'checkout.session.completed',
            'payment_intent.succeeded',
            'payment_intent.payment_failed'
          ],
          api_version: '2023-10-16',
          description: `Webhook for UitmMart Seller: ${user.shop.name}`
        }, {
          stripeAccount: account.id
        });
        
        console.log(`Successfully registered webhook for connected account: ${webhook.id}`);
      } catch (webhookError) {
        console.error('Failed to register webhook for connected account:', webhookError);
        // Continue despite webhook registration failure - we'll try again later
      }
    } catch (updateError) {
      console.error('Error updating shop with Stripe account ID:', updateError);
      // Continue even if the database update fails
    }
    
    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/seller/payment?error=true`,
      return_url: `${baseUrl}/seller/payment?success=true`,
      type: 'account_onboarding',
    });
    
    console.log('Account link created, redirecting to:', accountLink.url);
    
    return NextResponse.json({ 
      url: accountLink.url,
      accountId: account.id,
    });
    
  } catch (error) {
    console.error('Error creating Stripe account:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe account', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 