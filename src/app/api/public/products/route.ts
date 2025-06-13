import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/products - Get all products for public display (no auth required)
export async function GET(req: NextRequest) {
  try {
    // Get search parameters for potential filtering
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const searchQuery = url.searchParams.get('search');
    const shopIdParam = url.searchParams.get('shopId');
    
    // Build filter based on search params
    const whereClause: Record<string, unknown> = {
      // Only show active products to the public
      status: 'active'
    };
    
    if (category && category !== 'All') {
      whereClause.category = category;
    }
    
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }
    
    // Filter by shop ID if provided
    if (shopIdParam) {
      const shopId = parseInt(shopIdParam);
      if (!isNaN(shopId)) {
        whereClause.shopId = shopId;
      }
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching public products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
} 