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
    console.log('Testing with fresh email approach');
    
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
    
    // Clear any existing account
    if (user.shop.stripeAccountId) {
      await prisma.shop.update({
        where: { id: user.shop.id },
        data: { stripeAccountId: null, webhookSetup: false },
      });
    }
    
    // Generate a completely unique email that definitely doesn't exist
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const freshEmail = `uitmmart-seller-${timestamp}-${randomSuffix}@example.com`;
    
    console.log('Using fresh email for testing:', freshEmail);
    
    // Test different approaches with the fresh email
    const approaches = [
      {
        name: 'Fresh Email - No Prefill',
        config: {
          type: 'standard',
          country: 'MY',
          metadata: {
            userId: user.id.toString(),
            shopId: user.shop.id.toString(),
            testEmail: freshEmail,
            originalEmail: user.email,
          },
        }
      },
      {
        name: 'Fresh Email - With Business Type',
        config: {
          type: 'standard',
          country: 'MY',
          business_type: 'individual',
          metadata: {
            userId: user.id.toString(),
            shopId: user.shop.id.toString(),
            testEmail: freshEmail,
            originalEmail: user.email,
          },
        }
      },
      {
        name: 'Fresh Email - With Prefilled Email',
        config: {
          type: 'standard',
          country: 'MY',
          email: freshEmail,
          business_type: 'individual',
          metadata: {
            userId: user.id.toString(),
            shopId: user.shop.id.toString(),
            testEmail: freshEmail,
            originalEmail: user.email,
          },
        }
      }
    ];
    
    for (const approach of approaches) {
      try {
        console.log(`Testing approach: ${approach.name}`);
        
        // Create account
        const account = await stripe.accounts.create(approach.config as any);
        console.log(`Account created: ${account.id}`);
        
        // Create account link
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${baseUrl}/seller/payment?error=true&test=fresh-email`,
          return_url: `${baseUrl}/seller/payment?success=true&account_id=${account.id}&test=fresh-email`,
          type: 'account_onboarding',
        });
        
        console.log(`Account link created: ${accountLink.url}`);
        
        // Return the first successful approach
        return NextResponse.json({
          success: true,
          approach: approach.name,
          accountId: account.id,
          url: accountLink.url,
          testEmail: freshEmail,
          originalEmail: user.email,
          message: `Testing with fresh email: ${freshEmail}`
        });
        
      } catch (error) {
        console.error(`Approach ${approach.name} failed:`, error);
        continue;
      }
    }
    
    return NextResponse.json({
      error: 'All fresh email approaches failed',
      testEmail: freshEmail,
      originalEmail: user.email,
    }, { status: 500 });
    
  } catch (error) {
    console.error('Fresh email test failed:', error);
    return NextResponse.json({
      error: 'Fresh email test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 