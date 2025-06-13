import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
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
    
    // Get product data from request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.description || !data.price || !data.stock || !data.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create the product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        category: data.category,
        images: data.images || [],
        status: 'active',
        shopId: user.shop.id,
      },
    });
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Get all products for the seller
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
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build where clause
    const where: {
      shopId: number;
      category?: string;
      status?: string;
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>;
    } = {
      shopId: user.shop.id,
    };
    
    if (category) {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get products
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(products);
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 