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
  console.log('[QR-UPLOAD-POST] generateUniqueFilename - originalName:', originalName, 'type:', type);
  
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  
  console.log('[QR-UPLOAD-POST] generateUniqueFilename - timestamp:', timestamp);
  console.log('[QR-UPLOAD-POST] generateUniqueFilename - randomString:', randomString);
  console.log('[QR-UPLOAD-POST] generateUniqueFilename - extension:', extension);
  
  const filename = `${type}_${timestamp}-${randomString}${extension}`;
  console.log('[QR-UPLOAD-POST] generateUniqueFilename - result:', filename);
  
  return filename;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[QR-UPLOAD-POST] Starting file upload process');
    
    // Get session ID from form data
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const file = formData.get('file') as File;

    console.log('[QR-UPLOAD-POST] Session ID:', sessionId);
    console.log('[QR-UPLOAD-POST] File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });

    if (!sessionId) {
      console.log('[QR-UPLOAD-POST] No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!file) {
      console.log('[QR-UPLOAD-POST] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('[QR-UPLOAD-POST] Looking up session in memory');
    console.log('[QR-UPLOAD-POST] Total sessions in memory:', uploadSessions.size);

    // Get the upload session
    const session = uploadSessions.get(sessionId);
    
    if (!session) {
      console.log('[QR-UPLOAD-POST] Session not found:', sessionId);
      console.log('[QR-UPLOAD-POST] Available sessions:', Array.from(uploadSessions.keys()));
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 404 }
      );
    }

    console.log('[QR-UPLOAD-POST] Session found:', {
      id: session.id,
      userId: session.userId,
      type: session.type,
      status: session.status,
      expiresAt: session.expiresAt
    });

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      console.log('[QR-UPLOAD-POST] Session expired, removing from memory');
      uploadSessions.delete(sessionId);
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 404 }
      );
    }

    // Check if session already has an upload
    if (session.status === 'uploaded') {
      console.log('[QR-UPLOAD-POST] Session already has uploaded file');
      return NextResponse.json(
        { error: 'Session already has an uploaded file' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit for verification files)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      console.log('[QR-UPLOAD-POST] File too large:', file.size, 'bytes (max:', MAX_SIZE, ')');
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }

    console.log('[QR-UPLOAD-POST] Converting file to buffer');
    // Get file buffer to check if it's actually an image
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    console.log('[QR-UPLOAD-POST] Buffer size:', buffer.length);
    console.log('[QR-UPLOAD-POST] Buffer first 10 bytes:', buffer.slice(0, 10));

    if (!isImageFile(buffer)) {
      console.log('[QR-UPLOAD-POST] File is not a valid image');
      return NextResponse.json(
        { error: 'The uploaded file is not a valid image (JPEG or PNG only)' },
        { status: 400 }
      );
    }

    console.log('[QR-UPLOAD-POST] File is a valid image');

    // Get file extension
    const fileExtension = path.extname(file.name).toLowerCase();
    console.log('[QR-UPLOAD-POST] File extension:', fileExtension);
    
    if (!['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      console.log('[QR-UPLOAD-POST] Invalid file extension:', fileExtension);
      return NextResponse.json(
        { error: 'Only JPEG and PNG files are allowed' },
        { status: 400 }
      );
    }

    // Create a unique filename with appropriate prefix
    console.log('[QR-UPLOAD-POST] Generating unique filename');
    let fileName: string;
    try {
      fileName = generateUniqueFilename(file.name, session.type);
      console.log('[QR-UPLOAD-POST] Generated filename:', fileName);
    } catch (err) {
      console.error('[QR-UPLOAD-POST] Error generating filename:', err);
      return NextResponse.json(
        { error: 'Failed to generate filename' },
        { status: 500 }
      );
    }
    
    // Define public directory path for storing the image
    let publicDir: string;
    let uploadsDir: string;
    let filePath: string;
    
    try {
      publicDir = path.join(process.cwd(), 'public');
      uploadsDir = path.join(publicDir, 'uploads', 'verification');
      filePath = path.join(uploadsDir, fileName);

      console.log('[QR-UPLOAD-POST] File paths:', {
        publicDir,
        uploadsDir,
        filePath
      });
    } catch (err) {
      console.error('[QR-UPLOAD-POST] Error creating file paths:', err);
      return NextResponse.json(
        { error: 'Failed to create file paths' },
        { status: 500 }
      );
    }

    // Ensure the verification uploads directory exists
    try {
      if (!existsSync(uploadsDir)) {
        console.log('[QR-UPLOAD-POST] Creating uploads directory');
        await mkdir(uploadsDir, { recursive: true });
      }
    } catch (err) {
      console.error('[QR-UPLOAD-POST] Error creating directory:', err);
      return NextResponse.json(
        { error: 'Failed to create upload directory' },
        { status: 500 }
      );
    }

    // Save the file
    try {
      console.log('[QR-UPLOAD-POST] Writing file to disk');
      await writeFile(filePath, buffer);
      console.log('[QR-UPLOAD-POST] File written successfully');
    } catch (err) {
      console.error('[QR-UPLOAD-POST] Error writing file:', err);
      console.error('[QR-UPLOAD-POST] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        filePath,
        fileName,
        bufferSize: buffer.length
      });
      return NextResponse.json(
        { error: 'Failed to save the file' },
        { status: 500 }
      );
    }

    // Create the image URL
    let imageUrl: string;
    try {
      imageUrl = `/uploads/verification/${fileName}`;
      console.log('[QR-UPLOAD-POST] Image URL:', imageUrl);
    } catch (err) {
      console.error('[QR-UPLOAD-POST] Error creating image URL:', err);
      return NextResponse.json(
        { error: 'Failed to create image URL' },
        { status: 500 }
      );
    }

    // Update session status
    try {
      console.log('[QR-UPLOAD-POST] Updating session status');
      session.status = 'uploaded';
      session.uploadedImageUrl = imageUrl;
      uploadSessions.set(sessionId, session);
      console.log('[QR-UPLOAD-POST] Session updated successfully');
    } catch (err) {
      console.error('[QR-UPLOAD-POST] Error updating session:', err);
      return NextResponse.json(
        { error: 'Failed to update session status' },
        { status: 500 }
      );
    }

    console.log('[QR-UPLOAD-POST] Upload completed successfully');
    console.log(`[QR-UPLOAD-POST] File uploaded successfully via QR code: ${imageUrl} for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      sessionId,
      imageUrl,
      type: session.type,
      message: `${session.type === 'studentId' ? 'Student ID' : 'Selfie'} uploaded successfully`
    });

  } catch (error) {
    console.error('[QR-UPLOAD-POST] Error handling QR upload:', error);
    console.error('[QR-UPLOAD-POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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