import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

// Platform fee percentage (5%)
const PLATFORM_FEE_PERCENTAGE = 0.05;

// Max length for image URLs to prevent Stripe URL length errors
const MAX_IMAGE_URL_LENGTH = 500;

export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract orderId from URL
    const pathname = req.nextUrl.pathname;
    const orderIdMatch = pathname.match(/\/orders\/([^\/]+)\/payment$/);
    
    if (!orderIdMatch || !orderIdMatch[1]) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }
    
    const orderId = parseInt(orderIdMatch[1]);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Find the order and check if it belongs to the current user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: session.user.id,
        paymentStatus: 'pending' // Only allow resuming payment for pending orders
      },
      include: {
        seller: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            variation: true,
            productName: true,
            productImage: true,
            productId: true
          }
        },
        shippingAddress: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or payment already completed' },
        { status: 404 }
      );
    }

    // Create line items for Stripe
    const lineItems = order.items.map(item => {
      // Get product image and ensure it's not too long
      let productImages: string[] = [];
      if (item.productImage && !item.productImage.startsWith('data:') && 
          item.productImage.length <= MAX_IMAGE_URL_LENGTH) {
        productImages = [item.productImage];
      }
      
      return {
        price_data: {
          currency: 'myr',
          product_data: {
            name: item.productName,
            images: productImages,
            metadata: {
              productId: item.productId.toString(),
              shopId: order.sellerId.toString()
            }
          },
          unit_amount: Math.round(parseFloat(item.unitPrice.toString()) * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Create proper URLs for success and cancel pages
    // Use either NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL, whichever is available
    const baseUrl = new URL(
      process.env.NEXT_PUBLIC_APP_URL || 
      process.env.NEXT_PUBLIC_BASE_URL || 
      'http://localhost:3000'
    );
    
    // Create a valid success URL with proper URL encoding
    const successUrl = new URL('/checkout/success', baseUrl);
    successUrl.searchParams.append('session_id', '{CHECKOUT_SESSION_ID}');
    
    // Create a valid cancel URL with proper URL encoding
    const cancelUrl = new URL('/checkout/cancel', baseUrl);

    // Check if we should use a connected account
    const useConnectedAccount = order.seller && order.seller.stripeAccountId;
    
    // Create Stripe checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      customer_email: session.user.email || undefined,
      metadata: {
        orderId: order.id.toString(),
        userId: session.user.id.toString()
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id.toString(),
          userId: session.user.id.toString()
        }
      }
    };
    
    // Create the session with the appropriate options
    let stripeSession;
    if (useConnectedAccount) {
      // Create session on connected account with application fee
      const connectedAccountOptions = {
        ...sessionOptions,
        payment_intent_data: {
          ...sessionOptions.payment_intent_data,
          application_fee_amount: Math.round(parseFloat(order.totalAmount.toString()) * PLATFORM_FEE_PERCENTAGE * 100) // Fee in cents
        }
      };
      
      stripeSession = await stripe.checkout.sessions.create(
        connectedAccountOptions, 
        { stripeAccount: order.seller.stripeAccountId || undefined }
      );
      console.log(`Created checkout session on connected account: ${order.seller.stripeAccountId}`);
    } else {
      // Create on platform account (no connected account available)
      stripeSession = await stripe.checkout.sessions.create(sessionOptions);
      console.log('Created checkout session on platform account');
    }

    // Update order with new Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        stripeSessionId: stripeSession.id,
        stripeAccountId: useConnectedAccount ? order.seller.stripeAccountId || undefined : undefined
      }
    });

    // Return the checkout session URL
    return NextResponse.json({ 
      url: stripeSession.url,
      sessionId: stripeSession.id,
      onConnectedAccount: !!useConnectedAccount
    });

  } catch (error) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
} 