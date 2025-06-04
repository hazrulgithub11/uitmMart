import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ratings
 * Creates a new product rating
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in to rate products' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { productId, orderId, stars, comment } = body;
    
    // Validate required fields
    if (!productId || !orderId || !stars) {
      return NextResponse.json(
        { success: false, message: 'Product ID, order ID, and rating are required' },
        { status: 400 }
      );
    }
    
    // Validate stars is between 1 and 5
    if (stars < 1 || stars > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5 stars' },
        { status: 400 }
      );
    }
    
    // Verify that the order belongs to the current user and includes the product
    const order = await prisma.order.findFirst({
      where: {
        id: Number(orderId),
        buyerId: user.id,
        status: 'delivered', // Only delivered orders can be rated
        items: {
          some: {
            productId: Number(productId)
          }
        }
      }
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or not eligible for rating' },
        { status: 404 }
      );
    }
    
    // Check if this product has already been rated for this order
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_productId_orderId: {
          userId: user.id,
          productId: Number(productId),
          orderId: Number(orderId)
        }
      }
    });
    
    if (existingRating) {
      // Update existing rating
      const updatedRating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          stars,
          comment: comment || null,
          updatedAt: new Date()
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Rating updated successfully',
        rating: updatedRating
      });
    } else {
      // Create new rating
      const newRating = await prisma.rating.create({
        data: {
          stars,
          comment: comment || null,
          userId: user.id,
          productId: Number(productId),
          orderId: Number(orderId)
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Rating submitted successfully',
        rating: newRating
      });
    }
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ratings
 * Gets ratings for a product
 */
export async function GET(request: NextRequest) {
  try {
    // Get product ID from query params
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');
    
    // If all parameters are provided, return a specific rating
    if (productId && orderId && userId) {
      const rating = await prisma.rating.findUnique({
        where: {
          userId_productId_orderId: {
            userId: Number(userId),
            productId: Number(productId),
            orderId: Number(orderId)
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        rating
      });
    }
    
    // If only product ID is provided, return all ratings for the product
    if (productId) {
      const ratings = await prisma.rating.findMany({
        where: { productId: Number(productId) },
        include: {
          user: {
            select: {
              username: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Calculate average rating
      const totalStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
      const averageRating = ratings.length > 0 ? totalStars / ratings.length : 0;
      
      return NextResponse.json({
        success: true,
        ratings,
        averageRating,
        totalRatings: ratings.length
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Product ID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching ratings:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
} 