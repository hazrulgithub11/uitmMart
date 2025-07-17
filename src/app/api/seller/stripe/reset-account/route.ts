import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
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
    
    // Clear the Stripe account ID and webhook setup status
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: { 
        stripeAccountId: null,
        webhookSetup: false
      },
    });
    
    console.log(`Reset Stripe account for shop ${user.shop.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Stripe account reset successfully. You can now start the connection process again.'
    });
    
  } catch (error) {
    console.error('Error resetting Stripe account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 