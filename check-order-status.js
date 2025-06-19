// Script to check a specific order status
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ORDER_ID = 12;

async function checkOrderStatus() {
  try {
    console.log(`Checking status for order ID: ${ORDER_ID}`);
    
    const order = await prisma.order.findUnique({
      where: { id: ORDER_ID },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        stripeSessionId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!order) {
      console.error(`Order with ID ${ORDER_ID} not found`);
      return;
    }
    
    console.log('Order details:');
    console.log(`- Order Number: ${order.orderNumber}`);
    console.log(`- Status: ${order.status}`);
    console.log(`- Payment Status: ${order.paymentStatus}`);
    console.log(`- Stripe Session ID: ${order.stripeSessionId || 'None'}`);
    console.log(`- Created At: ${order.createdAt}`);
    console.log(`- Updated At: ${order.updatedAt}`);
    
  } catch (error) {
    console.error('Error checking order status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderStatus(); 