import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
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
    const orderIdMatch = pathname.match(/\/orders\/([^\/]+)$/);
    
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
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            variation: true,
            productName: true,
            productImage: true,
            productId: true
          }
        },
        shippingAddress: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
} 