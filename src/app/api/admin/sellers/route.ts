import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get the URL to extract user ID parameter
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      // Fetch specific user's verification data
      const userVerification = await prisma.user.findUnique({
        where: { 
          id: parseInt(userId),
          role: 'seller'
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          createdAt: true,
          studentVerification: {
            select: {
              id: true,
              studentIdImageUrl: true,
              selfieImageUrl: true,
              verificationStatus: true,
              submittedAt: true,
              reviewedAt: true,
              rejectionReason: true,
              studentIdNumber: true,
              studentName: true,
              university: true,
              expiryDate: true
            }
          }
        }
      });

      if (!userVerification) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        user: userVerification,
        verification: userVerification.studentVerification
      });
    }
    
    // Fetch all sellers with their student verification status (existing functionality)
    const sellers = await prisma.user.findMany({
      where: {
        role: 'seller'
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        studentVerification: {
          select: {
            verificationStatus: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Map the sellers to include status based on student verification
    const sellersWithStatus = sellers.map(seller => ({
      id: seller.id,
      username: seller.username,
      email: seller.email,
      createdAt: seller.createdAt,
      status: seller.studentVerification?.verificationStatus === 'approved' ? 'active' :
              seller.studentVerification?.verificationStatus === 'rejected' ? 'suspended' :
              'pending' // This covers 'pending', 'under_review', or no verification record
    }));
    
    return NextResponse.json(sellersWithStatus);
    
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sellers', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 