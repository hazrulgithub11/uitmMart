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
    
    // Get URL params for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');
    
    // Build where clause
    const where: {
      sellerId: number;
      status?: string;
      paymentStatus?: string;
      OR?: Array<{ orderNumber: { contains: string } } | { buyer: { email: { contains: string; mode: 'insensitive' } } }>;
    } = {
      sellerId: user.shop.id,
    };
    
    if (status && status !== 'All') {
      where.status = status;
    }
    
    if (paymentStatus && paymentStatus !== 'All') {
      where.paymentStatus = paymentStatus;
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { buyer: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    // Get orders
    const orders = await prisma.order.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ orders });
    
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 