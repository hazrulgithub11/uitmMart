import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cart - Get the current user's cart items
export async function GET() {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Fetch the cart items with product and shop details
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: userId,
      },
      include: {
        product: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                seller: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ cartItems });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return NextResponse.json({ error: 'Failed to fetch cart items' }, { status: 500 });
  }
}

// POST /api/cart - Add a product to the cart
export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { productId, quantity, variation } = await request.json();
    
    // Validate required fields
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Validate quantity is a positive number
    if (quantity && (typeof quantity !== 'number' || quantity <= 0)) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });
    }
    
    // Ensure variation is a string (or empty string if null/undefined)
    const normalizedVariation = variation || "";
    
    // Check if the product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    if (product.status !== 'active') {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
    }
    
    // Don't check stock when adding to cart - stock will be checked during checkout
    
    // Check if the product is already in the cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId_variation: {
          userId,
          productId,
          variation: normalizedVariation,
        },
      },
    });
    
    let cartItem;
    
    if (existingCartItem) {
      // Update the quantity if the product is already in the cart
      const newQuantity = existingCartItem.quantity + (quantity || 1);
      
      // Don't check stock when adding to cart - stock will be checked during checkout
      
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
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
    } else {
      // Add the product to the cart if it's not already there
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity: quantity || 1,
          variation: normalizedVariation,
        },
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
    }
    
    return NextResponse.json({ 
      message: 'Product added to cart',
      cartItem 
    });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return NextResponse.json({ error: 'Failed to add product to cart' }, { status: 500 });
  }
}

// DELETE /api/cart - Clear all cart items for the current user
export async function DELETE() {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Delete all cart items for this user
    const deleteResult = await prisma.cartItem.deleteMany({
      where: {
        userId: userId,
      }
    });
    
    return NextResponse.json({ 
      message: `Cleared ${deleteResult.count} items from cart`,
      count: deleteResult.count
    });
  } catch (error) {
    console.error('Error clearing cart items:', error);
    return NextResponse.json({ error: 'Failed to clear cart items' }, { status: 500 });
  }
} 