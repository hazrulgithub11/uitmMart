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
    console.log('=== DEBUG: Starting Stripe account creation analysis ===');
    
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
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   'http://localhost:3000';
    
    console.log('DEBUG: User info:', {
      userId: user.id,
      email: user.email,
      shopId: user.shop.id,
      existingStripeAccount: user.shop.stripeAccountId
    });
    
    // Clear any existing account
    if (user.shop.stripeAccountId) {
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { stripeAccountId: null, webhookSetup: false },
      });
    }
    
    // Try different account creation approaches
    const approaches = [
      {
        name: 'Minimal Standard Account',
        config: {
          type: 'standard',
          country: 'MY',
          metadata: {
            userId: user.id.toString(),
            shopId: user.shop.id.toString(),
          },
        }
      },
      {
        name: 'Standard Account with Business Individual',
        config: {
          type: 'standard',
          country: 'MY',
          business_type: 'individual',
          metadata: {
            userId: user.id.toString(),
            shopId: user.shop.id.toString(),
          },
        }
      },
      {
        name: 'Standard Account with Capabilities Only',
        config: {
          type: 'standard',
          country: 'MY',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: {
            userId: user.id.toString(),
            shopId: user.shop.id.toString(),
          },
        }
      }
    ];
    
    const results = [];
    
    for (const approach of approaches) {
      try {
        console.log(`DEBUG: Trying approach: ${approach.name}`);
        
        // Create account
        const account = await stripe.accounts.create(approach.config as any);
        console.log(`DEBUG: Account created: ${account.id}`);
        
        // Create account link
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${baseUrl}/seller/payment?error=true&approach=${encodeURIComponent(approach.name)}`,
          return_url: `${baseUrl}/seller/payment?success=true&account_id=${account.id}&approach=${encodeURIComponent(approach.name)}`,
          type: 'account_onboarding',
        });
        
        console.log(`DEBUG: Account link created: ${accountLink.url}`);
        
        // Get account details
        const accountDetails = await stripe.accounts.retrieve(account.id);
        
        results.push({
          approach: approach.name,
          success: true,
          accountId: account.id,
          accountLink: accountLink.url,
          accountDetails: {
            id: accountDetails.id,
            country: accountDetails.country,
            type: accountDetails.type,
            business_type: accountDetails.business_type,
            details_submitted: accountDetails.details_submitted,
            charges_enabled: accountDetails.charges_enabled,
            payouts_enabled: accountDetails.payouts_enabled,
            requirements: accountDetails.requirements,
            email: accountDetails.email,
          }
        });
        
        // Use the first successful approach
        return NextResponse.json({ 
          message: 'Account created successfully',
          approach: approach.name,
          accountId: account.id,
          url: accountLink.url,
          accountDetails: results[0].accountDetails,
          debugInfo: {
            allResults: results,
            userInfo: {
              userId: user.id,
              email: user.email,
              shopId: user.shop.id,
            }
          }
        });
        
      } catch (error) {
        console.error(`DEBUG: Approach ${approach.name} failed:`, error);
        results.push({
          approach: approach.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      error: 'All approaches failed',
      results: results,
      debugInfo: {
        userInfo: {
          userId: user.id,
          email: user.email,
          shopId: user.shop.id,
        }
      }
    }, { status: 500 });
    
  } catch (error) {
    console.error('DEBUG: Error in debug endpoint:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 