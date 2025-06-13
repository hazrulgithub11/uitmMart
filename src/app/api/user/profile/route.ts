import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET route handler to fetch current user profile data
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

    // Fetch user's profile data
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        phoneNumber: true,
        gender: true,
        dateOfBirth: true,
        profileImage: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile data
    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT route handler to update user profile data
export async function PUT(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Check if the user is logged in
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to update your profile' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = session.user.id;

    // Parse the request body
    const body = await request.json();
    
    // Extract updateable fields from the request
    const {
      fullName,
      phoneNumber,
      gender,
      dateOfBirth,
      profileImage,
      email,
    } = body;

    // Prepare update data - only include fields that were provided
    const updateData: Record<string, unknown> = {};
    
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (gender !== undefined) updateData.gender = gender;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (email !== undefined) updateData.email = email;
    
    // Handle date of birth conversion if provided
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    // Update user profile in the database
    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        phoneNumber: true,
        gender: true,
        dateOfBirth: true,
        profileImage: true,
        role: true,
      },
    });

    // Return the updated user profile
    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 