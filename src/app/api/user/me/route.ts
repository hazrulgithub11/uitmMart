import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET handler to fetch the current user's info
export async function GET() {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Check if the user is logged in
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to access this resource' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = session.user.id;

    // Fetch user's data
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        phoneNumber: true,
        gender: true,
        dateOfBirth: true,
        profileImage: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 