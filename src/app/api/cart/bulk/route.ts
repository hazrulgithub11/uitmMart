import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/cart/bulk - Bulk operations on cart items (delete multiple)
export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { action, itemIds } = await request.json();
    
    // Validate the request
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Item IDs must be a non-empty array' }, { status: 400 });
    }
    
    // Process based on the action
    switch (action) {
      case 'delete':
        // First, verify all items belong to the user
        const cartItems = await prisma.cartItem.findMany({
          where: {
            id: { in: itemIds },
          }
        });
        
        // Check if any items don't belong to the user
        const unauthorizedItems = cartItems.filter((item: { userId: number }) => item.userId !== userId);
        if (unauthorizedItems.length > 0) {
          return NextResponse.json({ error: 'You do not have permission to delete some items' }, { status: 403 });
        }
        
        // Delete all the specified items
        const deleteResult = await prisma.cartItem.deleteMany({
          where: {
            id: { in: itemIds },
            userId: userId,
          }
        });
        
        return NextResponse.json({
          message: `Deleted ${deleteResult.count} items from cart`,
          count: deleteResult.count,
          deletedIds: itemIds
        });
      
      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing bulk operation on cart items:', error);
    return NextResponse.json({ error: 'Failed to process bulk operation' }, { status: 500 });
  }
} 