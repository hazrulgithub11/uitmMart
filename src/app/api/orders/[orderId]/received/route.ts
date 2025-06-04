import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const orderIdMatch = pathname.match(/\/orders\/([^\/]+)\/received/);
    
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
        buyerId: session.user.id
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if the order is in a valid state to be marked as received
    if (order.status !== 'shipped') {
      return NextResponse.json(
        { error: 'Order cannot be marked as received' },
        { status: 400 }
      );
    }

    // Update the order status to delivered
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        status: 'delivered',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Order marked as received',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error marking order as received:', error);
    return NextResponse.json(
      { error: 'Failed to mark order as received' },
      { status: 500 }
    );
  }
} 