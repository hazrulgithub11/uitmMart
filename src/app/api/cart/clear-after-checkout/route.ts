import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/cart/clear-after-checkout - Special endpoint for clearing cart after checkout
export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { orderId, productIds } = await request.json();
    
    // If product IDs are provided, only clear those specific items
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      console.log(`Selectively clearing cart after checkout for user ${userId}, order ${orderId || 'unknown'}, products:`, productIds);
      
      // Convert all product IDs to numbers for consistency
      const normalizedProductIds = productIds.map(id => 
        typeof id === 'string' ? parseInt(id) : id
      );
      
      // Delete only the specific cart items for this user
      const deleteResult = await prisma.cartItem.deleteMany({
        where: {
          userId: userId,
          productId: { in: normalizedProductIds }
        }
      });
      
      console.log(`Selectively cleared ${deleteResult.count} items from cart after checkout`);
      
      return NextResponse.json({ 
        message: `Selectively cleared ${deleteResult.count} items from cart after checkout`,
        count: deleteResult.count
      });
    } else {
      console.log(`No product IDs provided for selective cart clearing for user ${userId}, order ${orderId || 'unknown'}`);
      return NextResponse.json({ 
        message: 'No product IDs provided for selective cart clearing',
        count: 0
      });
    }
  } catch (error) {
    console.error('Error clearing cart after checkout:', error);
    return NextResponse.json({ error: 'Failed to clear cart after checkout' }, { status: 500 });
  }
} 