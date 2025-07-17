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
    
    // Use either environment variable for base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   'http://localhost:3000';
    
    // Check if the seller already has a Stripe account
    if (user.shop.stripeAccountId) {
      console.log('Existing Stripe account found, checking status');
      
      try {
        // Check the actual account status with Stripe
        const account = await stripe.accounts.retrieve(user.shop.stripeAccountId);
        
        // Check if account is fully onboarded
        if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
          console.log('Account is fully onboarded, creating account link for updates');
      
          // Account is fully set up, create account link for updates
          const accountLink = await stripe.accountLinks.create({
            account: user.shop.stripeAccountId,
            refresh_url: `${baseUrl}/seller/payment?error=true`,
            return_url: `${baseUrl}/seller/payment?success=true`,
            type: 'account_onboarding',
          });
          
          return NextResponse.json({ url: accountLink.url });
        } else {
          console.log('Account exists but onboarding not complete, creating onboarding link');
          
          // Account exists but onboarding is not complete, create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: user.shop.stripeAccountId,
        refresh_url: `${baseUrl}/seller/payment?error=true`,
        return_url: `${baseUrl}/seller/payment?success=true`,
        type: 'account_onboarding',
      });
      
      return NextResponse.json({ url: accountLink.url });
        }
      } catch (stripeError) {
        console.error('Error checking Stripe account status:', stripeError);
        
        // If account doesn't exist in Stripe but we have an ID, clear it
        if (stripeError instanceof Stripe.errors.StripeError && stripeError.code === 'resource_missing') {
          console.log('Stripe account not found, clearing invalid account ID');
          
          await prisma.shop.update({
            where: { id: user.shop.id },
            data: { stripeAccountId: null },
          });
          
          // Fall through to create new account
        } else {
          return NextResponse.json(
            { error: 'Failed to check Stripe account status' },
            { status: 500 }
          );
        }
      }
    }
    
    console.log('Creating new Stripe account');
    
    // Create a new Stripe Connected Account
    // Don't pre-fill ANY information to ensure fresh account creation
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'MY', // Malaysia, change as needed
      // Completely avoid pre-filling email, business info, etc. to force new account creation
      metadata: {
        userId: user.id.toString(),
        shopId: user.shop.id.toString(),
        shopName: user.shop.name, // Store shop name in metadata only
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    console.log('Stripe account created:', account.id);
    
    // DON'T save the account ID to database yet - wait for onboarding completion
    // Instead, store it temporarily for onboarding completion verification
    
    // Create an account link for onboarding
    // Use account_onboarding type which should allow new account creation
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/seller/payment?error=true`,
      return_url: `${baseUrl}/seller/payment?success=true&account_id=${account.id}`,
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