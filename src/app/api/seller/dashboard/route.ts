import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
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
    
    // Get shop ID
    const shopId = user.shop.id;
    
    // Get product count
    const productCount = await prisma.product.count({
      where: {
        shopId: shopId
      }
    });
    
    // Get orders count
    const ordersCount = await prisma.order.count({
      where: {
        sellerId: shopId
      }
    });
    
    // Get unique customers count (buyers who have placed orders with this seller)
    const uniqueCustomers = await prisma.order.findMany({
      where: {
        sellerId: shopId
      },
      select: {
        buyerId: true
      },
      distinct: ['buyerId']
    });
    
    const customerCount = uniqueCustomers.length;
    
    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        sellerId: shopId
      },
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
            totalPrice: true,
            productName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // Calculate total revenue
    const totalRevenue = await prisma.order.aggregate({
      where: {
        sellerId: shopId,
        paymentStatus: 'paid'
      },
      _sum: {
        sellerPayout: true
      }
    });
    
    // Return dashboard stats
    return NextResponse.json({
      productCount,
      ordersCount,
      customerCount,
      recentOrders,
      totalRevenue: totalRevenue._sum.sellerPayout || 0
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 