import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Start a transaction to delete all user-related data
    await prisma.$transaction(async (tx) => {
      // Delete user addresses
      await tx.address.deleteMany({
        where: { userId }
      });

      // Delete user ratings
      await tx.rating.deleteMany({
        where: { userId }
      });

      // Delete user cart items
      await tx.cartItem.deleteMany({
        where: { userId }
      });

      // For sellers, delete their shop and products
      if (session.user.role === 'SELLER') {
        // Find the shop owned by this user
        const shop = await tx.shop.findUnique({
          where: { sellerId: userId }
        });

        if (shop) {
          // Delete shop products
          await tx.product.deleteMany({
            where: { shopId: shop.id }
          });

          // Delete the shop
          await tx.shop.delete({
            where: { id: shop.id }
          });
        }
      }

      // Delete user orders (this might be a soft delete in a real system)
      await tx.order.deleteMany({
        where: { buyerId: userId }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json(
      { message: 'Account successfully deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again.' },
      { status: 500 }
    );
  }
} 