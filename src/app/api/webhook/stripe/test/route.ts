import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/emailService';

// Test webhook endpoint for email testing - CAUTION: Only use in development environment
export async function POST(req: Request) {
  // Security check - only allow this in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is not available in production' }, { status: 403 });
  }
  
  console.log('Test webhook received - for email testing only');
  
  try {
    const payload = await req.json();
    const event = payload as Stripe.Event;
    
    console.log('Test event type:', event.type);
    
    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Processing test checkout.session.completed event');
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, test: true });
  } catch (error) {
    console.error('Error processing test webhook:', error);
    return NextResponse.json(
      { error: 'Error processing test webhook' },
      { status: 500 }
    );
  }
}

// Handle successful checkout completion
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Handling test checkout session completed', session.id);
  console.log('Session metadata:', session.metadata);
  
  if (!session.metadata?.orderIds) {
    console.error('No order IDs found in session metadata');
    return;
  }

  const orderIds = session.metadata.orderIds.split(',').map(id => parseInt(id));
  console.log('Order IDs to process:', orderIds);
  
  try {
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
        
        if (order) {
          console.log(`Sending test order confirmation email for order ${orderId} to ${order.buyer.email}`);
          await sendOrderConfirmationEmail({ order });
          console.log('Test email sent successfully');
        } else {
          console.error(`Order ${orderId} not found`);
        }
      } catch (emailError) {
        console.error(`Error sending test email for order ${orderId}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Error in test webhook:', error);
    throw error;
  }
} 