import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// POST - Upload shop logo
export async function POST(request: Request) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userIdFromForm = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!userIdFromForm) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Check if the user is authorized to upload for this shop
    const userIdNumber = parseInt(userIdFromForm);
    
    if (isNaN(userIdNumber)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // Only allow uploads if the user is uploading for their own shop, or if they're an admin
    if (session.user.id !== userIdNumber && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/shop-logo');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Create a unique filename using user ID and timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'png';
    const filename = `shop_${userIdNumber}_${timestamp}.${fileExtension}`;
    const filepath = path.join(uploadDir, filename);

    // Convert file to buffer and save it
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the relative path to be stored in the database
    const relativePath = `/shop-logo/${filename}`;
    
    console.log(`Logo uploaded successfully for user ${userIdNumber}: ${relativePath}`);
    
    return NextResponse.json({ 
      success: true, 
      filePath: relativePath 
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ 
      error: `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 