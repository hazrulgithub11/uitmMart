import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to extract product ID from URL
function extractProductId(pathname: string): number | null {
  const idMatch = pathname.match(/\/api\/public\/products\/(\d+)/);
  if (!idMatch || !idMatch[1]) {
    return null;
  }
  
  const productId = parseInt(idMatch[1]);
  return isNaN(productId) ? null : productId;
}

// GET - Get public product by ID (no auth required)
export async function GET(request: NextRequest) {
  try {
    // Extract id from URL path
    const productId = extractProductId(request.nextUrl.pathname);
    
    if (productId === null) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }
    
    // Include shop data with the product to reduce multiple API calls
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        shop: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
} 