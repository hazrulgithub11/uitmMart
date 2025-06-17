import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get sessionId from query
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Find order by Stripe session ID
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: sessionId,
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
        }
      }
    });

    if (!order) {
      return NextResponse.json({ 
        order: null,
        message: 'No order found with this session ID'
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order by session ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
} 