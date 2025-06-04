import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/seller/profile - Get current seller profile
export async function GET() {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// PUT /api/seller/profile - Update seller profile
export async function PUT(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    const body = await req.json();
    
    // Check if email is already taken by another user
    if (body.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: body.email,
          NOT: {
            id: userId
          }
        }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use by another account" },
          { status: 400 }
        );
      }
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: body.fullName,
        email: body.email
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true
      }
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
} 