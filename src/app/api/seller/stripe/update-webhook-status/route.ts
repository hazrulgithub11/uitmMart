import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { webhookSetup } = await request.json();
    
    if (typeof webhookSetup !== 'boolean') {
      return NextResponse.json(
        { error: 'webhookSetup must be a boolean' },
        { status: 400 }
      );
    }
    
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
    
    // Update the webhook setup status
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: { 
        webhookSetup: webhookSetup 
      },
    });
    
    return NextResponse.json({
      success: true,
      webhookSetup: webhookSetup
    });
    
  } catch (error) {
    console.error('Error updating webhook status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 