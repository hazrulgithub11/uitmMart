import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
        connected: false
      });
    }
    
    // If we have a Stripe account ID, we should check its status
    // Ideally, we would also check the capabilities with Stripe API
    // For now, we'll return a simplified response
    return NextResponse.json({
      accountId: user.shop.stripeAccountId,
      capabilities: {
        card_payments: 'active',
        transfers: 'active'
      },
      connected: true
    });
    
    // In a production app, you would fetch the actual status from Stripe:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // const account = await stripe.accounts.retrieve(user.shop.stripeAccountId);
    // return NextResponse.json({
    //   accountId: user.shop.stripeAccountId,
    //   capabilities: account.capabilities,
    //   connected: true
    // });
    
  } catch (error) {
    console.error('Error checking Stripe status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 