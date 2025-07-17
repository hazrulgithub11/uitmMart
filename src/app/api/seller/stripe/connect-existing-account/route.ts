import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId || typeof accountId !== 'string') {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Basic validation of account ID format
    if (!accountId.startsWith('acct_')) {
      return NextResponse.json(
        { error: 'Invalid account ID format. Should start with "acct_"' },
        { status: 400 }
      );
    }
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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
    
    // Check if we have Stripe configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }
    
    try {
      // Verify the account exists and get its details
      const account = await stripe.accounts.retrieve(accountId);
      
      console.log('Retrieved account:', {
        id: account.id,
        type: account.type,
        country: account.country,
        email: account.email,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      });
      
      // Check if account is from Malaysia
      if (account.country !== 'MY') {
        return NextResponse.json(
          { error: `Account country is ${account.country}. Only Malaysian accounts are supported.` },
          { status: 400 }
        );
      }
      
      // Check if account is the correct type
      if (account.type !== 'standard') {
        return NextResponse.json(
          { error: `Account type is ${account.type}. Only standard accounts are supported.` },
          { status: 400 }
        );
      }
      
      // Check if account is already connected to another shop
      const existingShop = await prisma.shop.findFirst({
        where: { 
          stripeAccountId: accountId,
          NOT: { id: user.shop.id } // Exclude current shop
        }
      });
      
      if (existingShop) {
        return NextResponse.json(
          { error: 'This Stripe account is already connected to another shop' },
          { status: 400 }
        );
      }
      
      // Update the shop with the Stripe account ID
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { 
          stripeAccountId: accountId,
          webhookSetup: false // Reset webhook setup status
        },
      });
      
      console.log('Shop updated with Stripe account ID:', accountId);
      
      // Set up webhooks for the connected account
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.NEXT_PUBLIC_BASE_URL || 
                       'http://localhost:3000';
        
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
          stripeAccount: accountId
        });
        
        console.log(`Successfully registered webhook for account: ${webhook.id}`);
      } catch (webhookError) {
        console.error('Failed to register webhook:', webhookError);
        // Continue despite webhook registration failure
      }
      
      return NextResponse.json({
        success: true,
        message: 'Stripe account connected successfully',
        accountId: accountId,
        accountDetails: {
          id: account.id,
          type: account.type,
          country: account.country,
          email: account.email,
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          capabilities: account.capabilities,
          requirements: account.requirements
        }
      });
      
    } catch (stripeError) {
      console.error('Error verifying Stripe account:', stripeError);
      
      if (stripeError instanceof Stripe.errors.StripeError) {
        if (stripeError.code === 'resource_missing') {
          return NextResponse.json(
            { error: 'Stripe account not found. Please check your account ID.' },
            { status: 404 }
          );
        } else if (stripeError.code === 'permission_denied') {
          return NextResponse.json(
            { error: 'Permission denied. This account cannot be accessed.' },
            { status: 403 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to verify Stripe account. Please check your account ID.' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error connecting existing account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 