import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Function to check if a file is an image
function isImageFile(buffer: Buffer) {
  // Simple check for image file signatures
  // JPEG: Starts with FF D8 FF
  // PNG: Starts with 89 50 4E 47
  if (buffer.length < 4) return false;
  
  return (
    // JPEG signature
    (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) ||
    // PNG signature
    (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47)
  );
}

// Generate a unique filename using crypto instead of uuid
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  return `${timestamp}-${randomString}${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Check if the user is logged in
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to upload files' },
        { status: 401 }
      );
    }

    // Create a FormData object from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Check if file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (1MB limit)
    const MAX_SIZE = 1 * 1024 * 1024; // 1MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 1MB limit' },
        { status: 400 }
      );
    }

    // Get file buffer to check if it's actually an image
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    if (!isImageFile(buffer)) {
      return NextResponse.json(
        { error: 'The uploaded file is not a valid image (JPEG or PNG only)' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Only JPEG and PNG files are allowed' },
        { status: 400 }
      );
    }

    // Create a unique filename
    const fileName = generateUniqueFilename(file.name);
    
    // Define public directory path for storing the image
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const filePath = path.join(uploadsDir, fileName);

    // Ensure the uploads directory exists
    try {
      await writeFile(filePath, buffer);
    } catch (err) {
      console.error('Error writing file:', err);
      return NextResponse.json(
        { error: 'Failed to save the file' },
        { status: 500 }
      );
    }

    // Return the URL to the uploaded image
    const imageUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: imageUrl });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 