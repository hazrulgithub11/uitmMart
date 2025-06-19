import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    // Account updated events
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      
      try {
        // Find the shop with this Stripe account ID
        const shop = await prisma.shop.findFirst({
          where: { 
            stripeAccountId: account.id 
          },
          include: { seller: true },
        });

        if (shop) {
          // Update shop details or capabilities status if needed
          // This is a simplified example - in a real app you would check capabilities and update status
          console.log(`Account ${account.id} updated for shop ${shop.name}`);
        }
      } catch (error) {
        console.error('Error processing account.updated event:', error);
      }
      break;
    }

    // Handle payment-related events
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
      
      try {
        // Extract order IDs from metadata
        if (paymentIntent.metadata?.orderIds) {
          const orderIds = paymentIntent.metadata.orderIds.split(',').map(id => parseInt(id));
          
          // Update all associated orders
          await prisma.order.updateMany({
            where: {
              id: { in: orderIds }
            },
            data: {
              paymentStatus: 'paid',
              status: 'processing', // Move from pending to processing
              updatedAt: new Date()
            }
          });
          
          console.log(`Updated payment status for orders: ${orderIds.join(', ')}`);
        }
      } catch (error) {
        console.error('Error updating order payment status:', error);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} failed`);
      
      try {
        // Extract order IDs from metadata
        if (paymentIntent.metadata?.orderIds) {
          const orderIds = paymentIntent.metadata.orderIds.split(',').map(id => parseInt(id));
          
          // Update all associated orders
          await prisma.order.updateMany({
            where: {
              id: { in: orderIds }
            },
            data: {
              paymentStatus: 'failed',
              updatedAt: new Date()
            }
          });
          
          console.log(`Updated payment status to failed for orders: ${orderIds.join(', ')}`);
        }
      } catch (error) {
        console.error('Error updating order payment status:', error);
      }
      break;
    }

    // Handle checkout session completion
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Checkout session ${session.id} completed`);
      
      try {
        // Find orders with this session ID
        const orders = await prisma.order.findMany({
          where: {
            stripeSessionId: session.id
          }
        });
        
        if (orders.length > 0) {
          // Update all associated orders
          await prisma.order.updateMany({
            where: {
              stripeSessionId: session.id
            },
            data: {
              paymentStatus: 'paid',
              status: 'processing', // Move from pending to processing
              updatedAt: new Date()
            }
          });
          
          console.log(`Updated payment status for orders with session ID: ${session.id}`);
        }
      } catch (error) {
        console.error('Error updating order status for completed checkout session:', error);
      }
      break;
    }

    // Add other event types as needed

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 