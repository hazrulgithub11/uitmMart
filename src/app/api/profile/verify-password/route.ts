import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Check if the user is logged in
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to verify your password' },
        { status: 401 }
      );
    }

    // Get the password from the request body
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { password: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 400 }
      );
    }

    // Password is valid
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying your password' },
      { status: 500 }
    );
  }
} 