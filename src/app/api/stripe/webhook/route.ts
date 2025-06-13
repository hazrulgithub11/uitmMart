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
      // Handle successful payment
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} failed`);
      // Handle failed payment
      break;
    }

    // Add other event types as needed

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 