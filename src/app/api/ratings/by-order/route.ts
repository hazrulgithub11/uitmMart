import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ratings/by-order
 * Gets all ratings for a specific order
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in to view ratings' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get order ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Verify that the order belongs to the current user
    const order = await prisma.order.findFirst({
      where: {
        id: Number(orderId),
        buyerId: user.id
      }
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or not authorized' },
        { status: 404 }
      );
    }
    
    // Get all ratings for this order by this user
    const ratings = await prisma.rating.findMany({
      where: {
        orderId: Number(orderId),
        userId: user.id
      },
      select: {
        id: true,
        stars: true,
        comment: true,
        productId: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      ratings
    });
    
  } catch (error) {
    console.error('Error fetching ratings by order:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
} 