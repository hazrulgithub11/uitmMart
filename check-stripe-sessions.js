// Script to check Stripe session IDs and their status from Stripe API
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function checkStripeSessions() {
  try {
    console.log('Checking orders with Stripe session IDs...');
    
    // Get all orders that have a Stripe session ID
    const orders = await prisma.order.findMany({
      where: {
        stripeSessionId: {
          not: null
        }
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        stripeSessionId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 most recent orders
    });
    
    console.log(`Found ${orders.length} orders with Stripe session IDs`);
    
    // Check each session against Stripe API
    for (const order of orders) {
      try {
        console.log(`\nOrder #${order.orderNumber} (ID: ${order.id})`);
        console.log(`- Status: ${order.status}`);
        console.log(`- Payment Status: ${order.paymentStatus}`);
        console.log(`- Stripe Session ID: ${order.stripeSessionId}`);
        
        // Get the session from Stripe
        try {
          const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
          console.log(`- Stripe Session Status: ${session.status}`);
          console.log(`- Stripe Payment Status: ${session.payment_status}`);
          console.log(`- Session Metadata:`, session.metadata);
          
          // Check if session is paid but order is still pending
          if (session.payment_status === 'paid' && order.paymentStatus === 'pending') {
            console.log('⚠️ MISMATCH: Stripe shows paid but database shows pending');
          }
        } catch (stripeError) {
          console.log(`- Error retrieving Stripe session: ${stripeError.message}`);
        }
      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
      }
    }
  } catch (error) {
    console.error('Error checking Stripe sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStripeSessions(); 