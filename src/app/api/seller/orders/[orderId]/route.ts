import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get a specific order by ID
export async function GET(req: NextRequest) {
  try {
    // Extract orderId from URL
    const pathname = req.nextUrl.pathname;
    const orderIdMatch = pathname.match(/\/seller\/orders\/([^\/]+)$/);
    
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

    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true }
    });
    
    if (!user || user.role !== 'seller') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not a seller' },
        { status: 403 }
      );
    }
    
    if (!user.shop) {
      return NextResponse.json(
        { error: 'Seller shop not found' },
        { status: 404 }
      );
    }
    
    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true
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
    
    // Check if the order belongs to the seller
    if (order.sellerId !== user.shop.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Order does not belong to seller' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ order });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Update order status
export async function PATCH(req: NextRequest) {
  try {
    // Extract orderId from URL
    const pathname = req.nextUrl.pathname;
    const orderIdMatch = pathname.match(/\/seller\/orders\/([^\/]+)$/);
    
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

    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true }
    });
    
    if (!user || user.role !== 'seller') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not a seller' },
        { status: 403 }
      );
    }
    
    if (!user.shop) {
      return NextResponse.json(
        { error: 'Seller shop not found' },
        { status: 404 }
      );
    }
    
    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if the order belongs to the seller
    if (order.sellerId !== user.shop.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Order does not belong to seller' },
        { status: 403 }
      );
    }
    
    // Get update data from request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Check if status is valid
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    // Update the order
    const updateData: {
      status: string;
      cancellationReason?: string;
      cancellationDate?: Date;
      cancelledBy?: string;
      shippedAt?: Date;
      trackingNumber?: string;
      courierCode?: string;
      courierName?: string;
    } = {
      status: data.status,
    };
    
    // If order is being cancelled, add cancellation details
    if (data.status === 'cancelled') {
      if (!data.cancellationReason) {
        return NextResponse.json(
          { error: 'Cancellation reason is required' },
          { status: 400 }
        );
      }
      
      updateData.cancellationReason = data.cancellationReason;
      updateData.cancellationDate = new Date();
      updateData.cancelledBy = 'seller';
    }
    
    // If order is being shipped, add tracking details
    if (data.status === 'shipped') {
      updateData.shippedAt = new Date();
    }
    
    // Add tracking details if provided, regardless of status
    if (data.trackingNumber) {
      updateData.trackingNumber = data.trackingNumber;
    }
    
    if (data.courierCode) {
      updateData.courierCode = data.courierCode;
    }
    
    if (data.courierName) {
      updateData.courierName = data.courierName;
    }
    
    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
    
    return NextResponse.json({ order: updatedOrder });
    
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 