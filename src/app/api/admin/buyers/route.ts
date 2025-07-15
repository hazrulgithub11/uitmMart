import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get the URL to extract user ID parameter (for individual buyer details)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      // Fetch specific buyer's data
      const buyer = await prisma.user.findUnique({
        where: { 
          id: parseInt(userId),
          role: 'buyer'
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          createdAt: true,
          profileImage: true,
          orders: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              createdAt: true
            }
          }
        }
      });

      if (!buyer) {
        return NextResponse.json(
          { error: 'Buyer not found' },
          { status: 404 }
        );
      }

      // Calculate buyer statistics - convert Decimal to number
      const totalOrders = buyer.orders.length;
      const totalSpent = buyer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const recentOrders = buyer.orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      return NextResponse.json({
        ...buyer,
        totalOrders,
        totalSpent,
        recentOrders
      });
    }
    
    // Fetch all buyers with basic info and order statistics
    const buyers = await prisma.user.findMany({
      where: {
        role: 'buyer'
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        createdAt: true,
        profileImage: true,
        orders: {
          select: {
            totalAmount: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Map the buyers to include calculated statistics and status
    const buyersWithStats = buyers.map(buyer => {
      const totalOrders = buyer.orders.length;
      const totalSpent = buyer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      
      // Determine status based on activity (this is a simple implementation)
      // In a real system, you might have explicit status fields or more complex logic
      const status = totalOrders > 0 ? 'active' : 'pending';
      
      return {
        id: buyer.id,
        username: buyer.username,
        email: buyer.email,
        fullName: buyer.fullName,
        phoneNumber: buyer.phoneNumber,
        createdAt: buyer.createdAt,
        profileImage: buyer.profileImage,
        status,
        totalOrders,
        totalSpent
      };
    });
    
    return NextResponse.json(buyersWithStats);
    
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buyers', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 