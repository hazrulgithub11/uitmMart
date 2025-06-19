// Script to fix a specific order that is stuck in pending status
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

// Order ID to fix
const ORDER_ID = 12;

async function fixPendingOrder() {
  try {
    console.log(`Attempting to fix order ID: ${ORDER_ID}`);
    
    // Get the current order status
    const order = await prisma.order.findUnique({
      where: { id: ORDER_ID },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        stripeSessionId: true,
        stripeAccountId: true,
        totalAmount: true,
        buyerId: true,
        sellerId: true
      }
    });
    
    if (!order) {
      console.error(`Order with ID ${ORDER_ID} not found`);
      return;
    }
    
    console.log('Current order status:');
    console.log(`- Order Number: ${order.orderNumber}`);
    console.log(`- Status: ${order.status}`);
    console.log(`- Payment Status: ${order.paymentStatus}`);
    console.log(`- Stripe Session ID: ${order.stripeSessionId || 'None'}`);
    
    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      console.log('Order is already marked as paid. No action needed.');
      return;
    }
    
    // If there's a Stripe session ID, try to check its status
    if (order.stripeSessionId) {
      try {
        // Try to retrieve the session from Stripe
        // Note: This might fail if the session is too old or doesn't exist
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        console.log(`Stripe session status: ${session.status}`);
        console.log(`Stripe payment status: ${session.payment_status}`);
        
        // If Stripe shows the payment as paid, update the order
        if (session.payment_status === 'paid') {
          console.log('Stripe shows this payment as paid. Updating order status...');
        } else {
          console.log('Stripe does not show this payment as paid.');
          console.log('Proceeding with manual update anyway based on confirmation from Stripe dashboard.');
        }
      } catch (stripeError) {
        console.log(`Could not retrieve Stripe session: ${stripeError.message}`);
        console.log('Proceeding with manual update based on confirmation from Stripe dashboard.');
      }
    }
    
    // Update the order status to paid and processing
    const updateResult = await prisma.order.update({
      where: { id: ORDER_ID },
      data: {
        status: 'processing',
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });
    
    console.log('Order successfully updated:');
    console.log(`- New Status: ${updateResult.status}`);
    console.log(`- New Payment Status: ${updateResult.paymentStatus}`);
    
    // Update product stock
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: ORDER_ID },
      include: { product: true }
    });
    
    console.log(`Found ${orderItems.length} items to update stock`);
    
    for (const item of orderItems) {
      const stockUpdate = await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: Math.max(0, item.product.stock - item.quantity)
        }
      });
      console.log(`Updated stock for product ${item.productId}: ${stockUpdate.stock}`);
    }
    
    console.log('Order fix completed successfully');
  } catch (error) {
    console.error('Error fixing order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPendingOrder(); 