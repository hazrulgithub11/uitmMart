import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { userId, action, rejectionReason } = await request.json();

    // Validate required fields
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // If rejecting, rejection reason is required
    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting an application' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
      include: {
        studentVerification: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.studentVerification) {
      return NextResponse.json(
        { error: 'No student verification record found for this user' },
        { status: 404 }
      );
    }

    // Check if verification is already processed
    if (user.studentVerification.verificationStatus === 'approved') {
      return NextResponse.json(
        { error: 'This verification has already been approved' },
        { status: 400 }
      );
    }

    // Update the student verification record
    const updatedVerification = await prisma.studentVerification.update({
      where: { userId: userIdInt },
      data: {
        verificationStatus: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        rejectionReason: action === 'reject' ? rejectionReason.trim() : null,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Verification ${action}d successfully for user:`, userIdInt);
    console.log('📝 Action details:', {
      action,
      reviewedBy: session.user.id,
      rejectionReason: action === 'reject' ? rejectionReason : null
    });

    return NextResponse.json({
      success: true,
      message: `Student verification ${action}d successfully`,
      data: {
        verificationStatus: updatedVerification.verificationStatus,
        reviewedAt: updatedVerification.reviewedAt,
        rejectionReason: updatedVerification.rejectionReason
      }
    });

  } catch (error) {
    console.error('❌ Error processing verification action:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Student verification record not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 