import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export async function POST(req: Request) {
  try {
    // Get session to know who is checking out
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to checkout' },
        { status: 401 }
      );
    }
    
    // Get the request body (cart items)
    const { items } = await req.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid checkout data. Cart is empty.' },
        { status: 400 }
      );
    }
    
    // Get product details for all cart items
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        shop: true,
      },
    });
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No valid products found in cart' },
        { status: 400 }
      );
    }
    
    // Organize line items by seller's Stripe account
    const sellerLineItems: Record<string, Array<{ price: string; quantity: number }>> = {};
    
    // Validate all products and organize by seller
    for (const product of products) {
      // Check if the product has Stripe IDs
      if (!product.stripePriceId || !product.stripeProductId) {
        // Product not synced with Stripe yet, do it now
        try {
          // Create an automatic sync if needed
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/seller/stripe/sync-products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          // Fetch the product again to get updated Stripe IDs
          const refreshedProduct = await prisma.product.findUnique({
            where: { id: product.id },
            include: { shop: true },
          });
          
          if (!refreshedProduct?.stripePriceId) {
            throw new Error(`Product ${product.name} could not be synced with Stripe.`);
          }
          
          // Update our product reference
          Object.assign(product, refreshedProduct);
        } catch (syncError) {
          console.error(`Failed to sync product ${product.id}:`, syncError);
          return NextResponse.json(
            { error: `Product "${product.name}" is not available for checkout. Please try again later.` },
            { status: 400 }
          );
        }
      }
      
      if (!product.shop.stripeAccountId) {
        return NextResponse.json(
          { error: `Seller for product "${product.name}" has not connected their Stripe account yet.` },
          { status: 400 }
        );
      }
      
      // Get the cart item for this product
      const cartItem = items.find(item => item.productId === product.id);
      if (!cartItem) continue;
      
      // Create array for this seller if it doesn't exist
      if (!sellerLineItems[product.shop.stripeAccountId]) {
        sellerLineItems[product.shop.stripeAccountId] = [];
      }
      
      // Add line item for this seller
      sellerLineItems[product.shop.stripeAccountId].push({
        price: product.stripePriceId!,
        quantity: cartItem.quantity,
      });
    }
    
    // Create a payment flow for each seller
    const stripeCheckoutSessions = [];
    for (const [stripeAccountId, lineItems] of Object.entries(sellerLineItems)) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.NEXT_PUBLIC_BASE_URL || 
                     'http://localhost:3000';
                     
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout/cancel`,
        payment_intent_data: {
          application_fee_amount: calculateApplicationFee(lineItems), // 5% platform fee
          transfer_data: {
            destination: stripeAccountId,
          },
        },
        metadata: {
          userId: session.user.id.toString(),
        },
      }, {
        stripeAccount: stripeAccountId, // This tells Stripe to create the session on the connected account
      });
      
      stripeCheckoutSessions.push({
        sessionId: stripeSession.id,
        url: stripeSession.url,
        stripeAccountId,
      });
    }
    
    // For simplicity, if there's only one seller, redirect directly to their checkout
    if (stripeCheckoutSessions.length === 1) {
      return NextResponse.json({ url: stripeCheckoutSessions[0].url });
    }
    
    // Otherwise return all session URLs for your frontend to handle multi-seller checkout
    return NextResponse.json({ sessions: stripeCheckoutSessions });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Calculate 5% platform fee on subtotal
function calculateApplicationFee(lineItems: { price: string; quantity: number }[]): number {
  // In a real app, you would calculate this based on line items
  // This is a simplified example
  const estimatedTotal = lineItems.reduce((total, item) => {
    // This is an approximation; in reality, you'd look up the price
    return total + (item.quantity * 100); // Simplified calculation
  }, 0);
  
  return Math.round(estimatedTotal * 0.05); // 5% fee
} 