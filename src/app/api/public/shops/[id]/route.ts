import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to extract shop ID from URL
function extractShopId(pathname: string): number | null {
  const idMatch = pathname.match(/\/api\/public\/shops\/(\d+)/);
  if (!idMatch || !idMatch[1]) {
    return null;
  }
  
  const shopId = parseInt(idMatch[1]);
  return isNaN(shopId) ? null : shopId;
}

// GET - Get public shop by ID (no auth required)
export async function GET(request: NextRequest) {
  try {
    // Extract id from URL path
    const shopId = extractShopId(request.nextUrl.pathname);
    
    if (shopId === null) {
      return NextResponse.json(
        { error: "Invalid shop ID" },
        { status: 400 }
      );
    }
    
    // Include seller information to get complete shop details
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
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