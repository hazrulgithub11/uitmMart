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
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
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
      // Verify the account exists and is fully set up
      const account = await stripe.accounts.retrieve(accountId);
      
      // Check if account is fully onboarded
      const onboardingComplete = account.details_submitted && account.charges_enabled && account.payouts_enabled;
      
      if (!onboardingComplete) {
        return NextResponse.json(
          { error: 'Account onboarding is not complete' },
          { status: 400 }
        );
      }
      
      // Verify the account belongs to this user
      if (account.metadata?.userId !== user.id.toString() || account.metadata?.shopId !== user.shop.id.toString()) {
        return NextResponse.json(
          { error: 'Account does not belong to this user' },
          { status: 403 }
        );
      }
      
      // Now save the account ID to the database
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { 
          stripeAccountId: accountId 
        },
      });
      
      console.log('Shop updated with Stripe account ID after successful onboarding');
      
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
        
        console.log(`Successfully registered webhook for connected account: ${webhook.id}`);
      } catch (webhookError) {
        console.error('Failed to register webhook for connected account:', webhookError);
        // Continue despite webhook registration failure - we'll try again later
      }
      
      return NextResponse.json({
        success: true,
        accountId: accountId,
        capabilities: account.capabilities,
        connected: true
      });
      
    } catch (stripeError) {
      console.error('Error verifying Stripe account:', stripeError);
      
      if (stripeError instanceof Stripe.errors.StripeError && stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { error: 'Stripe account not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to verify Stripe account' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 