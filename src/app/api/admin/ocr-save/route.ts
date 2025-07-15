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

    const { userId, studentName, studentIdNumber, university } = await request.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the student verification record
    const updatedVerification = await prisma.studentVerification.update({
      where: { userId: userIdInt },
      data: {
        studentName: studentName || null,
        studentIdNumber: studentIdNumber || null,
        university: university || null,
        updatedAt: new Date()
      }
    });

    console.log('✅ OCR data saved successfully for user:', userIdInt);
    console.log('📝 Updated data:', {
      studentName,
      studentIdNumber,
      university
    });

    return NextResponse.json({
      success: true,
      message: 'OCR data saved successfully',
      data: {
        studentName: updatedVerification.studentName,
        studentIdNumber: updatedVerification.studentIdNumber,
        university: updatedVerification.university
      }
    });

  } catch (error) {
    console.error('❌ Error saving OCR data:', error);
    
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