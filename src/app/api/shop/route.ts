import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Initialize Prisma client
const prisma = new PrismaClient();

// GET - Retrieve shop data for a user ID
export async function GET(request: Request) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    // Check for valid user ID from query params
    if (!userIdParam) {
      // Try to get user from session as fallback
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
      
      // Use session user ID
      const userId = session.user.id;
      
      // Find the shop for this seller
      const shops = await prisma.$queryRaw`
        SELECT * FROM "Shop" WHERE "sellerId" = ${userId} LIMIT 1
      `;
      
      const shopData = Array.isArray(shops) && shops.length > 0 ? shops[0] : null;
      
      if (!shopData) {
        return NextResponse.json({ message: 'No shop found for this user' }, { status: 404 });
      }
      
      return NextResponse.json({ shop: shopData }, { status: 200 });
    }
    
    // Parse user ID from query param
    const userId = parseInt(userIdParam);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // Verify permission - user can only access their own shop
    const session = await getServerSession(authOptions);
    if (session?.user?.id !== userId && session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Find the shop for this seller
    const shops = await prisma.$queryRaw`
      SELECT * FROM "Shop" WHERE "sellerId" = ${userId} LIMIT 1
    `;
    
    const shopData = Array.isArray(shops) && shops.length > 0 ? shops[0] : null;
    
    // Return shop data if it exists
    if (!shopData) {
      return NextResponse.json({ message: 'No shop found for this user' }, { status: 404 });
    }
    
    return NextResponse.json({ shop: shopData }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching shop data:', error);
    
    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: string }).code === 'string' && (error as { code: string }).code.startsWith('P')) {
      const prismaError = error as { code: string; message: string };
      return NextResponse.json({ 
        error: `Database error: ${prismaError.message}`,
        code: prismaError.code
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update shop data
export async function POST(request: Request) {
  try {
    // Get request body
    const data = await request.json();
    
    // Get session info
    const session = await getServerSession(authOptions);
    
    // Get user ID from request or session
    const userId = data.userId;
    
    // If user ID is from session, verify permission
    if (session?.user?.id) {
      // Admin can edit any shop, regular user can only edit their own
      if (session.user.role !== 'admin' && session.user.id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // No authenticated session
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
    }
    
    // Check if a shop already exists for this user using raw SQL
    const existingShops = await prisma.$queryRaw`
      SELECT * FROM "Shop" WHERE "sellerId" = ${userId} LIMIT 1
    `;
    
    const shopExists = Array.isArray(existingShops) && existingShops.length > 0;
    
    // Check the structure of the Shop table
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Shop'
    `;
    
    const columnNames = Array.isArray(tableInfo) 
      ? tableInfo.map((col: { column_name: string }) => col.column_name)
      : [];
    
    console.log('Available columns in Shop table:', columnNames);
    
    // Prepare shop data with only columns that exist in the database
    // This way we prevent errors from missing columns
    const shopData: Record<string, string | null> = {
      name: data.name,
      description: data.description || ''
    };
    
    // Add optional fields only if they exist in the table
    if (columnNames.includes('logoUrl')) shopData.logoUrl = data.logoUrl || null;
    if (columnNames.includes('phoneNumber')) shopData.phoneNumber = data.phoneNumber || null;
    if (columnNames.includes('email')) shopData.email = data.email || null;
    if (columnNames.includes('streetAddress')) shopData.streetAddress = data.streetAddress || null;
    if (columnNames.includes('building')) shopData.building = data.building || null;
    if (columnNames.includes('city')) shopData.city = data.city || null;
    if (columnNames.includes('postalCode')) shopData.postalCode = data.postalCode || null;
    if (columnNames.includes('state')) shopData.state = data.state || null;
    if (columnNames.includes('country')) shopData.country = data.country || 'Malaysia';
    
    // If shop exists, update it
    if (shopExists) {
      try {
        // Build the SET clause dynamically based on available columns
        let setClause = '';
        Object.entries(shopData).forEach(([key, value]) => {
          if (setClause) setClause += ', ';
          setClause += `"${key}" = ${value === null ? 'NULL' : `'${value}'`}`;
        });
        
        // Add the updated timestamp
        setClause += `, "updatedAt" = CURRENT_TIMESTAMP`;
        
        // Log the generated SQL for debugging
        const updateSql = `
          UPDATE "Shop" 
          SET ${setClause}
          WHERE "sellerId" = ${userId}
        `;
        console.log('Executing SQL:', updateSql);
        
        // Execute the update query
        await prisma.$executeRawUnsafe(updateSql);
        
        return NextResponse.json({ 
          success: true,
          message: 'Shop updated successfully' 
        }, { status: 200 });
      } catch (sqlError: unknown) {
        console.error('SQL error during update:', sqlError);
        const error = sqlError as { message?: string; code?: string };
        return NextResponse.json({
          error: `SQL error during update: ${error.message || 'Unknown SQL error'}`,
          code: error.code
        }, { status: 500 });
      }
    } 
    // If shop doesn't exist, create it
    else {
      try {
        // Build the column and value lists dynamically based on available columns
        const columns = Object.keys(shopData).map(key => `"${key}"`).join(', ');
        const values = Object.values(shopData).map(val => val === null ? 'NULL' : `'${val}'`).join(', ');
        
        // Log the generated SQL for debugging
        const insertSql = `
          INSERT INTO "Shop" (
            ${columns}, "sellerId", "createdAt", "updatedAt"
          ) VALUES (
            ${values}, ${userId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;
        console.log('Executing SQL:', insertSql);
        
        // Execute the insert query
        await prisma.$executeRawUnsafe(insertSql);
        
        return NextResponse.json({ 
          success: true,
          message: 'Shop created successfully' 
        }, { status: 201 });
      } catch (sqlError: unknown) {
        console.error('SQL error during insert:', sqlError);
        const error = sqlError as { message?: string; code?: string };
        return NextResponse.json({
          error: `SQL error during insert: ${error.message || 'Unknown SQL error'}`,
          code: error.code
        }, { status: 500 });
      }
    }
  } catch (error: unknown) {
    console.error('Error saving shop data:', error);
    
    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: string }).code === 'string' && (error as { code: string }).code.startsWith('P')) {
      const prismaError = error as { code: string; message?: string };
      return NextResponse.json({ 
        error: `Database error: ${prismaError.message || 'Unknown Prisma error'}`,
        code: prismaError.code
      }, { status: 500 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Internal server error: ${errorMessage}` 
    }, { status: 500 });
  }
} 