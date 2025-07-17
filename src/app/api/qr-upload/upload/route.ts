import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Import the sessions map from the shared module
import { uploadSessions } from '@/lib/qr-upload-sessions';

// Function to check if a file is an image
function isImageFile(buffer: Buffer) {
  if (buffer.length < 4) return false;
  
  return (
    // JPEG signature
    (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) ||
    // PNG signature
    (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47)
  );
}

// Function to generate unique filename
function generateUniqueFilename(originalName: string, type: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  return `${type}_${timestamp}-${randomString}${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get session ID from form data
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const file = formData.get('file') as File;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get the upload session
    const session = uploadSessions.get(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 404 }
      );
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      uploadSessions.delete(sessionId);
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 404 }
      );
    }

    // Check if session already has an upload
    if (session.status === 'uploaded') {
      return NextResponse.json(
        { error: 'Session already has an uploaded file' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit for verification files)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit' },
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

    // Create a unique filename with appropriate prefix
    const fileName = generateUniqueFilename(file.name, session.type);
    
    // Define public directory path for storing the image
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads', 'verification');
    const filePath = path.join(uploadsDir, fileName);

    // Ensure the verification uploads directory exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save the file
    try {
      await writeFile(filePath, buffer);
    } catch (err) {
      console.error('Error writing file:', err);
      return NextResponse.json(
        { error: 'Failed to save the file' },
        { status: 500 }
      );
    }

    // Create the image URL
    const imageUrl = `/uploads/verification/${fileName}`;

    // Update session status
    session.status = 'uploaded';
    session.uploadedImageUrl = imageUrl;
    uploadSessions.set(sessionId, session);

    console.log(`File uploaded successfully via QR code: ${imageUrl} for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      sessionId,
      imageUrl,
      type: session.type,
      message: `${session.type === 'studentId' ? 'Student ID' : 'Selfie'} uploaded successfully`
    });

  } catch (error) {
    console.error('Error handling QR upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve session info for the upload page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    console.log('[QR-UPLOAD-UPLOAD] GET /api/qr-upload/upload - Checking session:', sessionId);
    console.log('[QR-UPLOAD-UPLOAD] Total sessions in memory:', uploadSessions.size);

    if (!sessionId) {
      console.log('[QR-UPLOAD-UPLOAD] No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = uploadSessions.get(sessionId);
    
    if (!session) {
      console.log('[QR-UPLOAD-UPLOAD] Session not found in memory:', sessionId);
      console.log('[QR-UPLOAD-UPLOAD] Available sessions:', Array.from(uploadSessions.keys()));
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    console.log('[QR-UPLOAD-UPLOAD] Session found:', {
      id: session.id,
      status: session.status,
      type: session.type,
      expiresAt: session.expiresAt,
      isExpired: session.expiresAt < new Date()
    });

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      console.log('[QR-UPLOAD-UPLOAD] Session expired, removing from memory');
      uploadSessions.delete(sessionId);
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      type: session.type,
      status: session.status,
      expiresAt: session.expiresAt.toISOString()
    });

  } catch (error) {
    console.error('[QR-UPLOAD-UPLOAD] Error retrieving session info:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session info' },
      { status: 500 }
    );
  }
} 