import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/products - Get all products for a seller
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    let userId;
    let isAdmin = false;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      isAdmin = session.user.role === 'admin';
    } else {
      // If not authenticated, return error
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get search parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const searchQuery = url.searchParams.get('search');
    const allShops = url.searchParams.get('allShops');
    
    // Build filter based on search params
    const whereClause: Record<string, unknown> = {};
    
    // Check if admin is requesting all shops first
    if (isAdmin && allShops === 'true') {
      // Admin can see all products from all shops - no shopId filter
    } else {
      // Regular user - get their shop
      const shop = await prisma.shop.findFirst({
        where: { sellerId: userId },
      });
      
      if (!shop) {
        return NextResponse.json(
          { error: "Shop not found. You must create a shop before managing products." },
          { status: 404 }
        );
      }
      
      whereClause.shopId = shop.id;
    }
    
    if (category && category !== 'All') {
      whereClause.category = category;
    }
    
    if (status && status !== 'All') {
      whereClause.status = status;
    }
    
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    let userId;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // If not authenticated, return error
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get user shop - each seller should have their own shop
    const shop = await prisma.shop.findFirst({
      where: { sellerId: userId },
    });
    
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found. You must create a shop before adding products." },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    const { name, description, price, stock, category, images } = body;
    
    if (!name || !description || price === undefined || stock === undefined || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one product image is required" },
        { status: 400 }
      );
    }
    
    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        images,
        status: parseInt(stock) > 0 ? 'active' : 'out_of_stock',
        shopId: shop.id
      }
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
} 