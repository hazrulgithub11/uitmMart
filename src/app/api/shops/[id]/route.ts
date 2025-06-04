import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shops/[id] - Get shop by ID
export async function GET(request: NextRequest) {
  try {
    // Extract id from the URL path instead of using params
    const pathname = request.nextUrl.pathname;
    const idMatch = pathname.match(/\/api\/shops\/(\d+)/);
    
    if (!idMatch || !idMatch[1]) {
      return NextResponse.json(
        { error: "Invalid shop ID in URL" },
        { status: 400 }
      );
    }
    
    const shopId = parseInt(idMatch[1]);
    
    if (isNaN(shopId)) {
      return NextResponse.json(
        { error: "Invalid shop ID" },
        { status: 400 }
      );
    }
    
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        email: true,
        phoneNumber: true,
        city: true,
        state: true,
        country: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(shop);
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
} 