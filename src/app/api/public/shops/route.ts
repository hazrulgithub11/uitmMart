import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/shops - Get all shops for public display (no auth required)
export async function GET(req: NextRequest) {
  try {
    // Get search parameters for potential filtering
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Get shops with their order counts and aggregate sales
    const shops = await prisma.shop.findMany({
      take: limit,
      skip: skip,
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        city: true,
        state: true,
        country: true,
        _count: {
          select: {
            orders: true,
            products: true
          }
        }
      },
      orderBy: {
        orders: {
          _count: 'desc'
        }
      }
    });
    
    // For each shop, calculate total sales amount
    const shopsWithSales = await Promise.all(shops.map(async (shop) => {
      const sales = await prisma.order.aggregate({
        where: {
          sellerId: shop.id,
          status: {
            in: ['paid', 'processing', 'shipped', 'delivered']
          }
        },
        _sum: {
          totalAmount: true
        }
      });
      
      return {
        ...shop,
        totalSales: sales._sum.totalAmount || 0,
      };
    }));
    
    // Sort by total sales descending
    const sortedShops = shopsWithSales.sort((a, b) => 
      Number(b.totalSales) - Number(a.totalSales)
    );
    
    // Get total count for pagination
    const totalShops = await prisma.shop.count();
    
    return NextResponse.json({
      shops: sortedShops,
      pagination: {
        total: totalShops,
        page,
        limit,
        pages: Math.ceil(totalShops / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
} 