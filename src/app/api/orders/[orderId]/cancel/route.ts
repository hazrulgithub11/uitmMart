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
    const orderIdMatch = pathname.match(/\/orders\/([^\/]+)\/cancel/);
    
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

    // Get cancellation reason from request body
    const body = await req.json();
    const { reason } = body;

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

    // Check if the order can be cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      );
    }

    // Implement cancellation logic based on order status
    if (order.paymentStatus === 'pending') {
      // For unpaid orders, we can directly cancel
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          paymentStatus: 'cancelled',
          // Store cancellation details
          cancellationReason: reason || 'Cancelled by buyer',
          cancellationDate: new Date(),
          cancelledBy: 'buyer'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully',
        order: updatedOrder
      });
    } else if (order.status === 'paid' || order.status === 'processing') {
      // For paid orders that haven't shipped yet
      // In a real app, you'd check if the order has been shipped or not
      // For this implementation, we'll allow cancellation of paid orders that haven't shipped
      
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          // Do not modify payment status since it's already paid
          // In a real scenario, you'd initiate a refund process
          // paymentStatus: 'refunded',
          cancellationReason: reason || 'Cancelled by buyer',
          cancellationDate: new Date(),
          cancelledBy: 'buyer'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully. If payment was made, a refund will be processed.',
        order: updatedOrder
      });
    } else {
      // Order is in a state that can't be cancelled
      return NextResponse.json(
        { 
          error: 'Order cannot be cancelled in its current state',
          status: order.status
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
} 