import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/cart/[id] - Update a cart item (quantity)
export async function PUT(request: NextRequest) {
  try {
    // Extract id from the URL path
    const pathname = request.nextUrl.pathname;
    const idMatch = pathname.match(/\/api\/cart\/(\d+)/);
    
    if (!idMatch || !idMatch[1]) {
      return NextResponse.json(
        { error: "Invalid cart item ID in URL" },
        { status: 400 }
      );
    }
    
    const cartItemId = parseInt(idMatch[1]);
    
    if (isNaN(cartItemId)) {
      return NextResponse.json({ error: 'Invalid cart item ID' }, { status: 400 });
    }
    
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the request body
    const { quantity } = await request.json();
    
    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });
    }
    
    // Check if the cart item exists and belongs to the user
    const existingCartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true }
    });
    
    if (!existingCartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }
    
    if (existingCartItem.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Don't check stock when updating cart - stock will be checked during checkout
    
    // Update the cart item
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({ 
      message: 'Cart item updated successfully',
      cartItem: updatedCartItem 
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  }
}

// DELETE /api/cart/[id] - Remove a cart item
export async function DELETE(request: NextRequest) {
  try {
    // Extract id from the URL path
    const pathname = request.nextUrl.pathname;
    const idMatch = pathname.match(/\/api\/cart\/(\d+)/);
    
    if (!idMatch || !idMatch[1]) {
      return NextResponse.json(
        { error: "Invalid cart item ID in URL" },
        { status: 400 }
      );
    }
    
    const cartItemId = parseInt(idMatch[1]);
    
    if (isNaN(cartItemId)) {
      return NextResponse.json({ error: 'Invalid cart item ID' }, { status: 400 });
    }
    
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if the cart item exists and belongs to the user
    const existingCartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId }
    });
    
    if (!existingCartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }
    
    if (existingCartItem.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });
    
    return NextResponse.json({ 
      message: 'Cart item removed successfully',
      id: cartItemId
    });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
} 