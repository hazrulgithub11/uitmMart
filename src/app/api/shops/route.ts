import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/shops - Get the current user's shop
export async function GET() {
  try {
    // Get the authenticated user
    let userId;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // If not authenticated, return error
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Find the shop for this seller
    const shop = await prisma.shop.findFirst({
      where: { sellerId: userId }
    });
    
    if (!shop) {
      return NextResponse.json(
        { message: "No shop found for this user" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(shop);
  } catch (error) {
    console.error('Error fetching shop data:', error);
    return NextResponse.json(
      { error: "Failed to fetch shop data" },
      { status: 500 }
    );
  }
}

// POST /api/shops - Create or update shop
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    let userId;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // If not authenticated, return error
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Shop name is required" },
        { status: 400 }
      );
    }
    
    // Prepare shop data
    const shopData = {
      name: data.name,
      description: data.description || '',
      logoUrl: data.logoUrl || null,
      phoneNumber: data.phoneNumber || null,
      email: data.email || null,
      streetAddress: data.streetAddress || null,
      building: data.building || null,
      city: data.city || null,
      postalCode: data.postalCode || null,
      state: data.state || null,
      country: data.country || 'Malaysia',
      sellerId: userId
    };
    
    // Check if a shop already exists for this user
    const existingShop = await prisma.shop.findFirst({
      where: { sellerId: userId }
    });
    
    let shop;
    
    // If shop exists, update it
    if (existingShop) {
      shop = await prisma.shop.update({
        where: { id: existingShop.id },
        data: shopData
      });
      
      return NextResponse.json({ 
        shop,
        message: 'Shop updated successfully' 
      }, { status: 200 });
    } 
    // If shop doesn't exist, create it
    else {
      shop = await prisma.shop.create({
        data: shopData
      });
      
      return NextResponse.json({ 
        shop,
        message: 'Shop created successfully' 
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error saving shop data:', error);
    return NextResponse.json(
      { error: "Failed to save shop data" },
      { status: 500 }
    );
  }
} 