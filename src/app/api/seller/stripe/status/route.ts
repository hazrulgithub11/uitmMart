import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export async function GET() {
  try {
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
    
    // Check if the seller has a Stripe account connected
    if (!user.shop?.stripeAccountId) {
      return NextResponse.json({
        accountId: null,
        capabilities: null,
        connected: false,
        onboardingComplete: false
      });
    }

    // Check if we have Stripe configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        accountId: user.shop.stripeAccountId,
        capabilities: null,
        connected: false,
        onboardingComplete: false,
        error: 'Stripe not configured'
      });
    }

    try {
      // Check the actual account status with Stripe
      const account = await stripe.accounts.retrieve(user.shop.stripeAccountId);
      
      // Check if account is fully onboarded
      const onboardingComplete = account.details_submitted && account.charges_enabled && account.payouts_enabled;
      
      return NextResponse.json({
        accountId: user.shop.stripeAccountId,
        capabilities: account.capabilities,
        connected: onboardingComplete,
        onboardingComplete: onboardingComplete,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
        webhookSetup: user.shop.webhookSetup || false
      });
      
    } catch (stripeError) {
      console.error('Error checking Stripe account status:', stripeError);
      
      // If account doesn't exist in Stripe but we have an ID, clear it
      if (stripeError instanceof Stripe.errors.StripeError && stripeError.code === 'resource_missing') {
        console.log('Stripe account not found, clearing invalid account ID');
        
        await prisma.shop.update({
          where: { id: user.shop.id },
          data: { stripeAccountId: null },
        });
        
        return NextResponse.json({
          accountId: null,
          capabilities: null,
          connected: false,
          onboardingComplete: false
        });
      }
      
      // For other errors, return error but keep account ID
      return NextResponse.json({
        accountId: user.shop.stripeAccountId,
        capabilities: null,
        connected: false,
        onboardingComplete: false,
        error: 'Failed to check account status'
      });
    }
    
  } catch (error) {
    console.error('Error checking Stripe status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 