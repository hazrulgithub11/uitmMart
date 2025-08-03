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
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
}) : null;

export async function POST(request: Request) {
  try {
    console.log('Starting manual Stripe account connection process');
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', session.user.id);
    
    // Parse the request body to get the Stripe account ID
    const { stripeAccountId } = await request.json();
    
    if (!stripeAccountId || typeof stripeAccountId !== 'string') {
      return NextResponse.json(
        { error: 'Valid Stripe account ID is required' },
        { status: 400 }
      );
    }
    
    // Validate Stripe account ID format (should start with 'acct_')
    if (!stripeAccountId.startsWith('acct_')) {
      return NextResponse.json(
        { error: 'Invalid Stripe account ID format. It should start with "acct_"' },
        { status: 400 }
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
    
    console.log('Shop found:', user.shop.id);
    
    // Check if we have Stripe configured
    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured on this server' },
        { status: 500 }
      );
    }
    
    // Verify the Stripe account exists and is valid
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      if (!account) {
        return NextResponse.json(
          { error: 'Stripe account not found' },
          { status: 400 }
        );
      }
      
      // Note: Allowing the same Stripe account to be connected to multiple shops
      // This enables sellers to use one Stripe account across multiple shops if needed
      
      console.log('Stripe account verified:', account.id);
      
      // Update the shop with the Stripe account ID
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { 
          stripeAccountId: stripeAccountId 
        },
      });
      
      console.log('Shop updated with Stripe account ID');
      
      return NextResponse.json({ 
        success: true,
        message: 'Stripe account connected successfully',
        accountId: stripeAccountId,
        capabilities: account.capabilities || {
          card_payments: 'active',
          transfers: 'active'
        }
      });
      
    } catch (stripeError: any) {
      console.error('Error verifying Stripe account:', stripeError);
      
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { error: 'Stripe account not found. Please check your account ID' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to verify Stripe account. Please check your account ID' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error connecting Stripe account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 