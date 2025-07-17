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
    console.log('Starting Malaysia-specific Stripe account creation');
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true }
    });
    
    if (!user || user.role !== 'seller' || !user.shop) {
      return NextResponse.json({ error: 'Invalid seller' }, { status: 403 });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   'http://localhost:3000';
    
    // Clear any existing account
    if (user.shop.stripeAccountId) {
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { stripeAccountId: null, webhookSetup: false },
      });
    }
    
    // Create account with absolutely minimal information
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'MY',
      // No business_type, no capabilities, no email, no business_profile
      // Just the absolute minimum
      metadata: {
        userId: user.id.toString(),
        shopId: user.shop.id.toString(),
        source: 'uitmmart_malaysia',
        created: new Date().toISOString(),
      },
    });
    
    console.log('Malaysia account created:', account.id);
    
    // Try different account link approaches
    const linkApproaches = [
      {
        name: 'Standard Onboarding',
        config: {
          account: account.id,
          refresh_url: `${baseUrl}/seller/payment?error=true&method=standard`,
          return_url: `${baseUrl}/seller/payment?success=true&account_id=${account.id}&method=standard`,
          type: 'account_onboarding' as const,
        }
      },
      {
        name: 'Account Update',
        config: {
          account: account.id,
          refresh_url: `${baseUrl}/seller/payment?error=true&method=update`,
          return_url: `${baseUrl}/seller/payment?success=true&account_id=${account.id}&method=update`,
          type: 'account_update' as const,
        }
      }
    ];
    
    for (const approach of linkApproaches) {
      try {
        console.log(`Trying link approach: ${approach.name}`);
        
        const accountLink = await stripe.accountLinks.create(approach.config);
        
        console.log(`${approach.name} link created: ${accountLink.url}`);
        
        // Return the first successful link
        return NextResponse.json({
          success: true,
          approach: approach.name,
          accountId: account.id,
          url: accountLink.url,
          message: `Created account with ${approach.name} approach`
        });
        
      } catch (linkError) {
        console.error(`${approach.name} failed:`, linkError);
        continue;
      }
    }
    
    // If we get here, all link approaches failed
    return NextResponse.json({
      error: 'All account link approaches failed',
      accountId: account.id,
      details: 'Account was created but could not generate onboarding link'
    }, { status: 500 });
    
  } catch (error) {
    console.error('Malaysia-specific account creation failed:', error);
    return NextResponse.json({
      error: 'Failed to create Malaysia account',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 