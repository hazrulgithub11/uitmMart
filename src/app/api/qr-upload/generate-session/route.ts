import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadSessions, UploadSession } from '@/lib/qr-upload-sessions';
import QRCode from 'qrcode';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('[QR-UPLOAD] POST /api/qr-upload/generate-session - Starting session generation');
    
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[QR-UPLOAD] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to generate upload sessions' },
        { status: 401 }
      );
    }

    const userId = parseInt(String(session.user.id));
    console.log('[QR-UPLOAD] User authenticated:', userId);
    
    // Get request body to determine upload type
    const body = await request.json();
    const { type } = body;
    console.log('[QR-UPLOAD] Upload type:', type);

    if (!type || !['studentId', 'selfie'].includes(type)) {
      console.log('[QR-UPLOAD] Invalid upload type:', type);
      return NextResponse.json(
        { error: 'Invalid upload type. Must be "studentId" or "selfie"' },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    console.log('[QR-UPLOAD] Generated session ID:', sessionId);
    
    // Create upload session
    const uploadSession: UploadSession = {
      id: sessionId,
      userId,
      type,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // Expires in 10 minutes
    };

    // Store session
    uploadSessions.set(sessionId, uploadSession);
    console.log('[QR-UPLOAD] Session stored. Total sessions:', uploadSessions.size);

    // Create upload URL for QR code
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const uploadUrl = `${baseUrl}/qr-upload?session=${sessionId}`;
    console.log('[QR-UPLOAD] Upload URL:', uploadUrl);

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(uploadUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('[QR-UPLOAD] QR code generated successfully');

    return NextResponse.json({
      sessionId,
      uploadUrl,
      qrCode: qrCodeDataUrl,
      type,
      expiresAt: uploadSession.expiresAt.toISOString(),
      message: `QR code generated for ${type} upload`
    });

  } catch (error) {
    console.error('[QR-UPLOAD] Error generating upload session:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload session' },
      { status: 500 }
    );
  }
}

// GET endpoint to check session status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    console.log('[QR-UPLOAD] GET /api/qr-upload/generate-session - Checking session:', sessionId);
    console.log('[QR-UPLOAD] Total sessions in memory:', uploadSessions.size);

    if (!sessionId) {
      console.log('[QR-UPLOAD] No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = uploadSessions.get(sessionId);
    
    if (!session) {
      console.log('[QR-UPLOAD] Session not found in memory:', sessionId);
      console.log('[QR-UPLOAD] Available sessions:', Array.from(uploadSessions.keys()));
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    console.log('[QR-UPLOAD] Session found:', {
      id: session.id,
      status: session.status,
      type: session.type,
      expiresAt: session.expiresAt,
      isExpired: session.expiresAt < new Date()
    });

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      console.log('[QR-UPLOAD] Session expired, removing from memory');
      uploadSessions.delete(sessionId);
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      type: session.type,
      uploadedImageUrl: session.uploadedImageUrl,
      expiresAt: session.expiresAt.toISOString()
    });

  } catch (error) {
    console.error('[QR-UPLOAD] Error checking session status:', error);
    return NextResponse.json(
      { error: 'Failed to check session status' },
      { status: 500 }
    );
  }
} 