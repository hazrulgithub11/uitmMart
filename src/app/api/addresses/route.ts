import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all addresses for the authenticated user
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

    // Fetch user's addresses using Prisma's direct query API
    const addresses = await prisma.$queryRaw`
      SELECT * FROM "Address" 
      WHERE "userId" = ${Number(userId)} 
      ORDER BY "isDefault" DESC, "createdAt" DESC
    `;

    // Return addresses
    return NextResponse.json(addresses);

  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST - Create a new address for the authenticated user
export async function POST(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Check if the user is logged in
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to add an address' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = Number(session.user.id);

    // Parse the request body
    const body = await request.json();
    
    // Extract address fields from the request
    const {
      recipientName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
      latitude,
      longitude
    } = body;

    // Validate required fields
    if (!recipientName || !phoneNumber || !addressLine1 || !city || !state || !postalCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this address is set as default, unset any existing default address
    if (isDefault) {
      await prisma.$executeRaw`
        UPDATE "Address" 
        SET "isDefault" = false 
        WHERE "userId" = ${userId} AND "isDefault" = true
      `;
    }

    // Create the new address using raw SQL
    const now = new Date();
    const newAddress = await prisma.$queryRaw`
      INSERT INTO "Address" (
        "recipientName", 
        "phoneNumber", 
        "addressLine1", 
        "addressLine2", 
        "city", 
        "state", 
        "postalCode", 
        "country", 
        "isDefault", 
        "userId", 
        "latitude",
        "longitude",
        "createdAt", 
        "updatedAt"
      ) 
      VALUES (
        ${recipientName}, 
        ${phoneNumber}, 
        ${addressLine1}, 
        ${addressLine2 || null}, 
        ${city}, 
        ${state}, 
        ${postalCode}, 
        ${country || 'Malaysia'}, 
        ${isDefault || false}, 
        ${userId}, 
        ${latitude || null},
        ${longitude || null},
        ${now}, 
        ${now}
      )
      RETURNING *
    `;

    // Return the new address
    return NextResponse.json(Array.isArray(newAddress) ? newAddress[0] : newAddress, { status: 201 });

  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update an existing address
export async function PUT(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Check if the user is logged in
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to update an address' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = Number(session.user.id);

    // Parse the request body
    const body = await request.json();
    
    // Extract address ID and fields from the request
    const {
      id,
      recipientName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
      latitude,
      longitude
    } = body;

    // Check if address ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    // Check if address exists and belongs to the user
    const existingAddressResult = await prisma.$queryRaw`
      SELECT * FROM "Address" WHERE id = ${Number(id)}
    `;
    
    const existingAddress = Array.isArray(existingAddressResult) && existingAddressResult.length > 0 
      ? existingAddressResult[0] 
      : null;

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    if (existingAddress.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this address' },
        { status: 403 }
      );
    }

    // If this address is set as default, unset any existing default address
    if (isDefault && !existingAddress.isDefault) {
      await prisma.$executeRaw`
        UPDATE "Address" 
        SET "isDefault" = false 
        WHERE "userId" = ${userId} AND "isDefault" = true
      `;
    }

    // Update the address
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE "Address" 
      SET 
        "recipientName" = ${recipientName || existingAddress.recipientName},
        "phoneNumber" = ${phoneNumber || existingAddress.phoneNumber},
        "addressLine1" = ${addressLine1 || existingAddress.addressLine1},
        "addressLine2" = ${addressLine2 !== undefined ? addressLine2 : existingAddress.addressLine2},
        "city" = ${city || existingAddress.city},
        "state" = ${state || existingAddress.state},
        "postalCode" = ${postalCode || existingAddress.postalCode},
        "country" = ${country || existingAddress.country},
        "isDefault" = ${isDefault !== undefined ? isDefault : existingAddress.isDefault},
        "latitude" = ${latitude !== undefined ? latitude : existingAddress.latitude},
        "longitude" = ${longitude !== undefined ? longitude : existingAddress.longitude},
        "updatedAt" = ${now}
      WHERE 
        "id" = ${Number(id)}
    `;

    // Get the updated address
    const updatedAddressResult = await prisma.$queryRaw`
      SELECT * FROM "Address" WHERE id = ${Number(id)}
    `;
    
    const updatedAddress = Array.isArray(updatedAddressResult) ? updatedAddressResult[0] : updatedAddressResult;

    // Return the updated address
    return NextResponse.json(updatedAddress);

  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete an address
export async function DELETE(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Check if the user is logged in
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to delete an address' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = Number(session.user.id);

    // Get address ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    // Check if address exists and belongs to the user
    const existingAddressResult = await prisma.$queryRaw`
      SELECT * FROM "Address" WHERE id = ${Number(id)}
    `;
    
    const existingAddress = Array.isArray(existingAddressResult) && existingAddressResult.length > 0 
      ? existingAddressResult[0] 
      : null;

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    if (existingAddress.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this address' },
        { status: 403 }
      );
    }

    // Delete the address
    await prisma.$executeRaw`
      DELETE FROM "Address" WHERE id = ${Number(id)}
    `;

    // If this was the default address, set another address as default (if any)
    if (existingAddress.isDefault) {
      const anotherAddressResult = await prisma.$queryRaw`
        SELECT * FROM "Address" WHERE "userId" = ${userId} LIMIT 1
      `;
      
      const anotherAddress = Array.isArray(anotherAddressResult) && anotherAddressResult.length > 0 
        ? anotherAddressResult[0] 
        : null;

      if (anotherAddress) {
        await prisma.$executeRaw`
          UPDATE "Address" 
          SET "isDefault" = true 
          WHERE "id" = ${anotherAddress.id}
        `;
      }
    }

    // Return success message
    return NextResponse.json({ 
      success: true, 
      message: 'Address deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address', details: (error as Error).message },
      { status: 500 }
    );
  }
} 