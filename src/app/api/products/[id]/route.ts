import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to extract product ID from URL
function extractProductId(pathname: string): number | null {
  const idMatch = pathname.match(/\/api\/products\/(\d+)/);
  if (!idMatch || !idMatch[1]) {
    return null;
  }
  
  const productId = parseInt(idMatch[1]);
  return isNaN(productId) ? null : productId;
}

// GET - Get product by ID
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
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
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

// PUT - Update product by ID
export async function PUT(request: NextRequest) {
  try {
    // Extract id from URL path
    const productId = extractProductId(request.nextUrl.pathname);
    
    if (productId === null) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }
    
    // Authenticate the user
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
    
    // Get user's shop
    const shop = await prisma.shop.findFirst({
      where: { sellerId: userId },
    });
    
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Check if the product belongs to the user's shop
    if (!isAdmin && existingProduct.shopId !== shop.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this product" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
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
    
    // Determine product status based on stock
    const stockValue = parseInt(stock);
    let status = existingProduct.status;
    
    if (stockValue === 0) {
      status = 'out_of_stock';
    } else if (body.status) {
      status = body.status;
    } else if (stockValue > 0 && existingProduct.status === 'out_of_stock') {
      status = 'active';
    }
    
    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: stockValue,
        category,
        images,
        status,
      }
    });
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product by ID
export async function DELETE(request: NextRequest) {
  try {
    // Extract id from URL path
    const productId = extractProductId(request.nextUrl.pathname);
    
    if (productId === null) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }
    
    // Authenticate the user
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
    
    // Get user's shop
    const shop = await prisma.shop.findFirst({
      where: { sellerId: userId },
    });
    
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Check if the product belongs to the user's shop
    if (!isAdmin && existingProduct.shopId !== shop.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this product" },
        { status: 403 }
      );
    }
    
    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });
    
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
} 