import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export async function POST() {
  try {
    console.log('Starting direct Stripe account creation process');
    
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   'http://localhost:3000';
    
    // If seller already has an account, clear it first to start fresh
    if (user.shop.stripeAccountId) {
      console.log('Clearing existing account to start fresh');
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { 
          stripeAccountId: null,
          webhookSetup: false 
        },
      });
    }
    
    // Create a minimal account that forces the full onboarding flow
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'MY',
      // Don't pre-fill anything - let Stripe handle the entire flow
      metadata: {
        userId: user.id.toString(),
        shopId: user.shop.id.toString(),
        tempAccount: 'true', // Mark this as temporary until onboarding complete
      },
    });
    
    console.log('Minimal Stripe account created:', account.id);
    
    // Create account link with minimal settings
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