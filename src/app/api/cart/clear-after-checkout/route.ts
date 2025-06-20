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
    const { orderId } = await request.json();
    
    console.log(`Clearing cart after checkout for user ${userId}, order ${orderId || 'unknown'}`);
    
    // Direct approach: delete all cart items for this user
    const deleteResult = await prisma.cartItem.deleteMany({
      where: {
        userId: userId
      }
    });
    
    console.log(`Cleared ${deleteResult.count} items from cart after checkout`);
    
    return NextResponse.json({ 
      message: `Cleared ${deleteResult.count} items from cart after checkout`,
      count: deleteResult.count
    });
  } catch (error) {
    console.error('Error clearing cart after checkout:', error);
    return NextResponse.json({ error: 'Failed to clear cart after checkout' }, { status: 500 });
  }
} 