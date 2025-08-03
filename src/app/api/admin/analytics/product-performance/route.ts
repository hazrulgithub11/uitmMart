import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters for timeframe
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '30'; // Default to 30 days
    const limit = parseInt(searchParams.get('limit') || '10'); // Default to top 10

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    console.log(`📊 Fetching analytics data for last ${timeframe} days...`);

    // Fetch products with all related data
    const products = await prisma.product.findMany({
      include: {
        shop: {
          select: {
            id: true,
            name: true
          }
        },
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                createdAt: true,
                status: true,
                paymentStatus: true,
                buyerId: true,
                totalAmount: true
              }
            }
          },
          where: {
            order: {
              createdAt: {
                gte: startDate,
                lte: endDate
              },
              paymentStatus: 'paid'
            }
          }
        },
        ratings: {
          select: {
            stars: true,
            userId: true
          }
        }
      }
    });

    // 1. TOP-SELLING PRODUCTS BY UNITS
    const topSellingByUnits = products
      .map(product => {
        const totalUnits = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        return {
          id: product.id,
          name: product.name,
          shopName: product.shop.name,
          category: product.category,
          totalUnits,
          price: Number(product.price)
        };
      })
      .filter(item => item.totalUnits > 0)
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .slice(0, limit);

    // 2. TOP REVENUE-GENERATING PRODUCTS
    const topRevenueProducts = products
      .map(product => {
        const totalRevenue = product.orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
        const totalUnits = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        return {
          id: product.id,
          name: product.name,
          shopName: product.shop.name,
          category: product.category,
          totalRevenue,
          totalUnits,
          price: Number(product.price)
        };
      })
      .filter(item => item.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    // 3. REPEAT BUYER COUNT PER PRODUCT
    const repeatBuyerData = products
      .map(product => {
        // Get unique buyers for this product
        const buyerOrderCounts = new Map<number, number>();
        
        product.orderItems.forEach(item => {
          const buyerId = item.order.buyerId;
          buyerOrderCounts.set(buyerId, (buyerOrderCounts.get(buyerId) || 0) + 1);
        });

        const totalBuyers = buyerOrderCounts.size;
        const repeatBuyers = Array.from(buyerOrderCounts.values()).filter(count => count > 1).length;
        const repeatRate = totalBuyers > 0 ? (repeatBuyers / totalBuyers) * 100 : 0;

        return {
          id: product.id,
          name: product.name,
          shopName: product.shop.name,
          category: product.category,
          totalBuyers,
          repeatBuyers,
          repeatRate: Number(repeatRate.toFixed(1))
        };
      })
      .filter(item => item.totalBuyers > 0)
      .sort((a, b) => b.repeatBuyers - a.repeatBuyers)
      .slice(0, limit);

    // 4. AVERAGE RATING VS SALES DATA
    const ratingVsSalesData = products
      .map(product => {
        const totalUnits = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const averageRating = product.ratings.length > 0 
          ? product.ratings.reduce((sum, rating) => sum + rating.stars, 0) / product.ratings.length 
          : 0;
        
        return {
          id: product.id,
          name: product.name,
          shopName: product.shop.name,
          category: product.category,
          totalUnits,
          averageRating: Number(averageRating.toFixed(1)),
          ratingCount: product.ratings.length,
          price: Number(product.price)
        };
      })
      .filter(item => item.totalUnits > 0 && item.ratingCount > 0) // Only products with both sales and ratings
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .slice(0, limit);

    // Calculate summary statistics
    const totalProductsSold = products.reduce((sum, product) => {
      return sum + product.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    const totalRevenue = products.reduce((sum, product) => {
      return sum + product.orderItems.reduce((itemSum, item) => itemSum + Number(item.totalPrice), 0);
    }, 0);

    const summary = {
      timeframe: `${timeframe} days`,
      totalProductsSold,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalProductsWithSales: products.filter(p => p.orderItems.length > 0).length,
      averageOrderValue: totalProductsSold > 0 ? Number((totalRevenue / totalProductsSold).toFixed(2)) : 0
    };

    console.log(`✅ Analytics data processed: ${topSellingByUnits.length} top selling products`);

    return NextResponse.json({
      success: true,
      data: {
        topSellingByUnits,
        topRevenueProducts,
        repeatBuyerData,
        ratingVsSalesData,
        summary
      }
    });

  } catch (error) {
    console.error('❌ Error fetching product performance analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 