import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/emailService';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Webhook endpoint to handle Stripe events
export async function POST(req: Request) {
  console.log('Webhook received');
  
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
      case 'payment_intent.succeeded':
        console.log('Processing payment_intent.succeeded event');
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, stripeAccount);
        break;
      case 'payment_intent.payment_failed':
        console.log('Processing payment_intent.payment_failed event');
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, stripeAccount);
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

// Handle successful checkout completion
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, connectedAccountId?: string) {
  console.log('Handling checkout session completed', session.id);
  console.log('Session metadata:', session.metadata);
  console.log('Session payment status:', session.payment_status);
  console.log('Session status:', session.status);
  console.log('Connected account ID:', connectedAccountId || 'None (platform event)');
  
  if (!session.metadata?.orderIds) {
    console.error('No order IDs found in session metadata');
    return;
  }

  const orderIds = session.metadata.orderIds.split(',').map(id => parseInt(id));
  console.log('Order IDs to update:', orderIds);
  
  try {
    // Update orders to paid status - check for connected account if present
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
        status: 'processing',
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });
    
    console.log('Orders update result:', updateResult);

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
        
        if (!order) {
          console.error(`Order ${orderId} not found when trying to send email`);
          continue;
        }
        
        // Get buyer information separately since it's not directly included in the order type
        const buyer = await prisma.user.findUnique({
          where: { id: order.buyerId }
        });
        
        if (!buyer?.email) {
          console.error(`No email found for buyer (ID: ${order.buyerId}) of order ${orderId}`);
          continue;
        }
        
        console.log(`Sending order confirmation email for order ${orderId} to ${buyer.email}`);
        
        // Try to send the email with retries
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            await sendOrderConfirmationEmail({ 
              order: {
                ...order,
                buyer
              } 
            });
            console.log(`Email sent successfully for order ${orderId}`);
            break;
          } catch (emailError) {
            attempts++;
            console.error(`Error sending email for order ${orderId} (attempt ${attempts}/${maxAttempts}):`, emailError);
            
            if (attempts >= maxAttempts) {
              console.error(`Failed to send email after ${maxAttempts} attempts for order ${orderId}`);
              // Could log to a separate error tracking system here
            } else {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          }
        }
      } catch (error) {
        console.error(`Error processing email for order ${orderId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error updating orders and stock:', error);
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
  
  try {
    // Update orders with payment details - check for connected account if present
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
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });
    
    console.log('Payment intent update result:', updateResult);
    console.log(`Payment confirmed for orders ${orderIds.join(', ')}`);
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
  } catch (error) {
    console.error('Error updating orders after payment intent failed:', error);
    throw error;
  }
} 