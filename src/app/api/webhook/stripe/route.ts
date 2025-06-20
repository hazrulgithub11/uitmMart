import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/emailService';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Add a direct function to clear cart items for a user
async function forceCartClear(userId: number | string | null, productIds?: number[] | string[]) {
  if (!userId) {
    console.log('No user ID provided for cart clearing');
    return;
  }
  
  try {
    // Convert userId to number if it's a string
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    // If specific product IDs are provided, only delete those items
    if (productIds && productIds.length > 0) {
      console.log(`Selectively clearing cart items for user ${userId} with product IDs:`, productIds);
      
      // Convert all product IDs to numbers for consistency
      const normalizedProductIds = productIds.map(id => 
        typeof id === 'string' ? parseInt(id) : id
      );
      
      // Delete only the specific cart items for this user
      const deleteResult = await prisma.cartItem.deleteMany({
        where: {
          userId: userIdNum,
          productId: { in: normalizedProductIds }
        }
      });
      
      console.log(`Selectively deleted ${deleteResult.count} cart items for user ${userId}`);
      return deleteResult.count;
    } else {
      console.log('No specific product IDs provided, skipping cart clearing');
      return 0;
    }
  } catch (error) {
    console.error('Error selectively clearing cart:', error);
    return 0;
  }
}

// Webhook endpoint to handle Stripe events
export async function POST(req: Request) {
  console.log('Webhook received at /api/webhook/stripe');
  
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  // Check if this is an event from a connected account
  const stripeAccount = req.headers.get('stripe-account') as string | undefined;

  if (!signature) {
    console.log('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe
    console.log('Verifying webhook signature');
    console.log('Webhook secret:', process.env.STRIPE_WEBHOOK_SECRET ? 'Present' : 'Missing');
    console.log('Stripe account header:', stripeAccount || 'Not present (platform event)');
    
    // Use the appropriate webhook secret based on whether this is from a connected account
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    
    console.log('Webhook signature verified successfully');
    console.log('Event type:', event.type);
    if (stripeAccount) {
      console.log('Event is from connected account:', stripeAccount);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Handle specific events
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Processing checkout.session.completed event');
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, stripeAccount);
        break;
      case 'checkout.session.expired':
        console.log('Processing checkout.session.expired event');
        await handleCheckoutSessionFailed(event.data.object as Stripe.Checkout.Session, stripeAccount, 'expired');
        break;
      case 'checkout.session.async_payment_failed':
        console.log('Processing checkout.session.async_payment_failed event');
        await handleCheckoutSessionFailed(event.data.object as Stripe.Checkout.Session, stripeAccount, 'payment_failed');
        break;
      case 'payment_intent.succeeded':
        console.log('Processing payment_intent.succeeded event');
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, stripeAccount);
        break;
      case 'payment_intent.payment_failed':
        console.log('Processing payment_intent.payment_failed event');
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, stripeAccount);
        break;
      case 'account.updated':
        console.log('Processing account.updated event');
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// Handle account updates
async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`Account ${account.id} updated`);
  
  try {
    // Find the shop with this Stripe account ID
    const shop = await prisma.shop.findFirst({
      where: { 
        stripeAccountId: account.id 
      },
      include: { seller: true },
    });

    if (shop) {
      // Log the account update
      console.log(`Found shop ${shop.name} for account ${account.id}`);
      
      // Here you could update shop status based on account capabilities
      // For example, if certain capabilities are disabled, you might want to update the shop status
    } else {
      console.log(`No shop found for account ${account.id}`);
    }
  } catch (error) {
    console.error('Error processing account.updated event:', error);
    throw error;
  }
}

// Handle successful checkout completion
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, connectedAccountId?: string) {
  console.log('Handling checkout session completed', session.id);
  console.log('Session metadata:', session.metadata);
  console.log('Session payment status:', session.payment_status);
  console.log('Session status:', session.status);
  console.log('Connected account ID:', connectedAccountId || 'None (platform event)');
  
  // Check if we have orderIds in the metadata
  if (!session.metadata?.orderIds) {
    // Try to find orders by session ID as a fallback
    try {
      const orders = await prisma.order.findMany({
        where: {
          stripeSessionId: session.id
        },
        select: {
          id: true
        }
      });
      
      if (orders.length > 0) {
        console.log(`Found ${orders.length} orders by session ID: ${session.id}`);
        const orderIds = orders.map(order => order.id);
        await updateOrdersToProcessing(orderIds, session.id, connectedAccountId);
        return;
      } else {
        console.error('No orders found for session ID:', session.id);
        return;
      }
    } catch (error) {
      console.error('Error finding orders by session ID:', error);
      return;
    }
  }

  const orderIds = session.metadata.orderIds.split(',').map(id => parseInt(id));
  const userId = session.metadata.userId ? parseInt(session.metadata.userId) : null;
  
  console.log('Order IDs to update:', orderIds);
  console.log('User ID from metadata:', userId);
  
  await updateOrdersToProcessing(orderIds, session.id, connectedAccountId, userId);
  
  // Get order items to know which products were in the order
  let productIds: number[] = [];
  if (session.metadata?.orderIds) {
    try {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          orderId: { in: orderIds }
        },
        select: {
          productId: true
        }
      });
      
      productIds = orderItems.map(item => item.productId);
      console.log(`Found ${productIds.length} product IDs from order items for selective cart clearing`);
    } catch (error) {
      console.error('Error getting product IDs from order items:', error);
    }
  }
  
  // Force clear the cart at the end of the function
  if (session.metadata?.userId && productIds.length > 0) {
    await forceCartClear(session.metadata.userId, productIds);
  }
}

// Common function to update orders to processing status
async function updateOrdersToProcessing(orderIds: number[], sessionId: string, connectedAccountId?: string, userId?: number | null) {
  try {
    // First check if any of these orders are already paid to avoid duplicate processing
    const existingOrders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        paymentStatus: 'paid'
      },
      select: {
        id: true
      }
    });
    
    if (existingOrders.length > 0) {
      console.log(`Orders already processed: ${existingOrders.map(o => o.id).join(', ')}`);
      // Filter out already processed orders
      orderIds = orderIds.filter(id => !existingOrders.some(o => o.id === id));
      
      if (orderIds.length === 0) {
        console.log('All orders already processed, nothing to update');
        return;
      }
    }
    
    // Update orders to paid status - check for connected account if present
    const whereClause: Record<string, unknown> = {
      id: { in: orderIds }
    };
    
    // Add session ID to where clause if available
    if (sessionId) {
      whereClause.stripeSessionId = sessionId;
    }
    
    // Add account ID to where clause if available
    if (connectedAccountId) {
      whereClause.stripeAccountId = connectedAccountId;
    }
    
    const updateResult = await prisma.order.updateMany({
      where: whereClause,
      data: {
        status: 'processing',
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });
    
    console.log('Orders update result:', updateResult);

    if (updateResult.count === 0) {
      // If no orders were updated with the strict criteria, try a more relaxed approach
      // This is a fallback for cases where the stripeAccountId might not be set correctly
      console.log('No orders updated with strict criteria, trying more relaxed criteria');
      
      const relaxedUpdateResult = await prisma.order.updateMany({
        where: {
          id: { in: orderIds }
        },
        data: {
          status: 'processing',
          paymentStatus: 'paid',
          updatedAt: new Date()
        }
      });
      
      console.log('Relaxed orders update result:', relaxedUpdateResult);
      
      if (relaxedUpdateResult.count === 0) {
        console.error('Failed to update any orders even with relaxed criteria');
        return;
      }
    }

    // Get order items to update product stock
    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIds }
      },
      include: {
        product: true
      }
    });
    
    console.log(`Found ${orderItems.length} order items to update stock`);

    // Update product stock for each item
    for (const item of orderItems) {
      const stockUpdate = await prisma.product.update({
        where: {
          id: item.productId
        },
        data: {
          stock: Math.max(0, item.product.stock - item.quantity)
        }
      });
      console.log(`Updated stock for product ${item.productId}: ${stockUpdate.stock}`);
    }

    console.log(`Orders ${orderIds.join(', ')} marked as paid and stock updated`);
    
    // Force clear cart for this user if userId is provided
    if (userId) {
      const productIds = orderItems.map(item => item.productId);
      await forceCartClear(userId, productIds);
    }
    
    // Send order confirmation email for each order
    for (const orderId of orderIds) {
      try {
        // Get the order with all needed relationships
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            buyer: true
          }
        });
        
        if (order && order.buyer.email) {
          await sendOrderConfirmationEmail({ order });
          console.log(`Order confirmation email sent for order ${orderId}`);
        }
      } catch (emailError) {
        console.error(`Error sending order confirmation email for order ${orderId}:`, emailError);
        // Don't throw the error as we don't want to fail the whole process
      }
    }
  } catch (error) {
    console.error('Error updating orders to processing status:', error);
    throw error;
  }
}

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, connectedAccountId?: string) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  console.log('Payment intent metadata:', paymentIntent.metadata);
  console.log('Connected account ID:', connectedAccountId || 'None (platform event)');
  
  if (!paymentIntent.metadata?.orderIds) {
    console.error('No order IDs found in payment intent metadata');
    return;
  }

  const orderIds = paymentIntent.metadata.orderIds.split(',').map(id => parseInt(id));
  const userId = paymentIntent.metadata.userId ? parseInt(paymentIntent.metadata.userId) : null;
  
  try {
    // Update orders with payment details - check for connected account if present
    const whereClause: Record<string, unknown> = {
      id: { in: orderIds }
    };
    
    // Add account ID to where clause if available
    if (connectedAccountId) {
      whereClause.stripeAccountId = connectedAccountId;
    }
    
    const updateResult = await prisma.order.updateMany({
      where: whereClause,
      data: {
        paymentStatus: 'paid',
        status: 'processing', // Ensure status is also updated to processing
        updatedAt: new Date()
      }
    });
    
    console.log('Payment intent update result:', updateResult);
    
    if (updateResult.count === 0) {
      // If no orders were updated with the strict criteria, try a more relaxed approach
      console.log('No orders updated with strict criteria, trying more relaxed criteria');
      
      const relaxedUpdateResult = await prisma.order.updateMany({
        where: {
          id: { in: orderIds }
        },
        data: {
          paymentStatus: 'paid',
          status: 'processing',
          updatedAt: new Date()
        }
      });
      
      console.log('Relaxed orders update result:', relaxedUpdateResult);
    }
    
    console.log(`Payment confirmed for orders ${orderIds.join(', ')}`);
    
    // Get product IDs from order items
    if (userId) {
      try {
        const orderItems = await prisma.orderItem.findMany({
          where: {
            orderId: { in: orderIds }
          },
          select: {
            productId: true
          }
        });
        
        const productIds = orderItems.map(item => item.productId);
        await forceCartClear(userId, productIds);
      } catch (error) {
        console.error('Error getting product IDs for cart clearing:', error);
      }
    }
  } catch (error) {
    console.error('Error updating orders after payment intent succeeded:', error);
    throw error;
  }
}

// Handle failed payment intent
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, connectedAccountId?: string) {
  console.log('Payment intent failed:', paymentIntent.id);
  console.log('Payment intent metadata:', paymentIntent.metadata);
  console.log('Connected account ID:', connectedAccountId || 'None (platform event)');
  
  if (!paymentIntent.metadata?.orderIds) {
    console.error('No order IDs found in payment intent metadata');
    return;
  }

  const orderIds = paymentIntent.metadata.orderIds.split(',').map(id => parseInt(id));
  const userId = paymentIntent.metadata.userId ? parseInt(paymentIntent.metadata.userId) : null;
  
  try {
    // Update orders with failed payment status - check for connected account if present
    const whereClause = connectedAccountId 
      ? {
          id: { in: orderIds },
          stripeAccountId: connectedAccountId
        }
      : {
          id: { in: orderIds }
        };
    
    const updateResult = await prisma.order.updateMany({
      where: whereClause,
      data: {
        paymentStatus: 'failed',
        status: 'cancelled',
        updatedAt: new Date()
      }
    });
    
    console.log('Failed payment update result:', updateResult);
    console.log(`Payment failed for orders ${orderIds.join(', ')}`);
    
    // Get product IDs from order items
    if (userId) {
      try {
        const orderItems = await prisma.orderItem.findMany({
          where: {
            orderId: { in: orderIds }
          },
          select: {
            productId: true
          }
        });
        
        const productIds = orderItems.map(item => item.productId);
        await forceCartClear(userId, productIds);
      } catch (error) {
        console.error('Error getting product IDs for cart clearing:', error);
      }
    }
  } catch (error) {
    console.error('Error updating orders after payment intent failed:', error);
    throw error;
  }
}

// Handle failed or expired checkout session
async function handleCheckoutSessionFailed(session: Stripe.Checkout.Session, connectedAccountId?: string, reason: 'expired' | 'payment_failed' = 'expired') {
  console.log(`Handling checkout session ${reason}:`, session.id);
  console.log('Session metadata:', session.metadata);
  console.log('Session payment status:', session.payment_status);
  console.log('Session status:', session.status);
  console.log('Connected account ID:', connectedAccountId || 'None (platform event)');
  
  if (!session.metadata?.orderIds) {
    console.error('No order IDs found in session metadata');
    return;
  }

  const orderIds = session.metadata.orderIds.split(',').map(id => parseInt(id));
  const userId = session.metadata.userId ? parseInt(session.metadata.userId) : null;
  
  console.log('Order IDs to update:', orderIds);
  console.log('User ID from metadata:', userId);
  
  try {
    // Update orders to cancelled status - check for connected account if present
    const whereClause = connectedAccountId 
      ? {
          id: { in: orderIds },
          stripeSessionId: session.id,
          stripeAccountId: connectedAccountId
        }
      : {
          id: { in: orderIds },
          stripeSessionId: session.id
        };
    
    const updateResult = await prisma.order.updateMany({
      where: whereClause,
      data: {
        status: 'cancelled',
        paymentStatus: reason === 'expired' ? 'expired' : 'failed',
        updatedAt: new Date()
      }
    });
    
    console.log('Orders update result:', updateResult);
    console.log(`Orders ${orderIds.join(', ')} marked as cancelled due to ${reason}`);
    
    // Get order items to know which products were in the order
    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIds }
      },
      select: {
        productId: true
      }
    });
    
    // Force clear cart for this user if userId is provided
    if (userId) {
      const productIds = orderItems.map(item => item.productId);
      await forceCartClear(userId, productIds);
    }
  } catch (error) {
    console.error(`Error updating orders after checkout session ${reason}:`, error);
    throw error;
  }
}