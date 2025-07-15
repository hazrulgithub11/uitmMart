import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';

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

// Generate a unique filename
function generateUniqueFilename(originalName: string, prefix: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  return `${prefix}_${timestamp}-${randomString}${extension}`;
}

// Function to safely delete old image files
async function deleteOldImageFile(imageUrl: string) {
  try {
    if (!imageUrl || !imageUrl.startsWith('/uploads/verification/')) {
      return; // Skip if not a local upload file
    }
    
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, imageUrl);
    
    await unlink(filePath);
    console.log(`Deleted old image file: ${filePath}`);
  } catch (error) {
    // Log error but don't fail the operation
    console.warn(`Failed to delete old image file: ${imageUrl}`, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to upload verification files' },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);

    // Check if request is JSON (for QR uploads or verification submission) or FormData (for direct uploads)
    const contentType = request.headers.get('content-type');
    const isJsonRequest = contentType?.includes('application/json');

    let type: string | null = null;
    let imageUrl: string | null = null;

    if (isJsonRequest) {
      // Handle JSON request (QR upload with existing image URL)
      const body = await request.json();
      type = body.type;
      imageUrl = body.imageUrl;

      // Handle verification submission (both images)
      if (type === 'verification') {
        const { studentIdImageUrl, selfieImageUrl } = body;
        
        if (!studentIdImageUrl || !selfieImageUrl) {
          return NextResponse.json(
            { error: 'Both student ID and selfie image URLs are required for verification' },
            { status: 400 }
          );
        }

        // Check if there's an existing verification to handle file cleanup
        const existingVerification = await prisma.studentVerification.findUnique({
          where: { userId }
        });

        // Delete old image files if they exist and are being replaced
        if (existingVerification) {
          if (existingVerification.studentIdImageUrl !== studentIdImageUrl) {
            await deleteOldImageFile(existingVerification.studentIdImageUrl);
          }
          if (existingVerification.selfieImageUrl !== selfieImageUrl) {
            await deleteOldImageFile(existingVerification.selfieImageUrl);
          }
        }

        // Create or update verification record with both images
        const verification = await prisma.studentVerification.upsert({
          where: { userId },
          update: {
            studentIdImageUrl,
            selfieImageUrl,
            verificationStatus: 'pending',
            submittedAt: new Date(),
            updatedAt: new Date(),
            // Clear rejection reason and review data on resubmission
            rejectionReason: null,
            reviewedAt: null,
            reviewedBy: null
          },
          create: {
            userId,
            studentIdImageUrl,
            selfieImageUrl,
            verificationStatus: 'pending',
            submittedAt: new Date()
          }
        });

        const isResubmission = existingVerification !== null;
        const successMessage = isResubmission 
          ? 'Verification resubmitted successfully! Your new application is now under review.'
          : 'Verification submitted successfully! Your application is now under review.';

        return NextResponse.json({ 
          success: true,
          verificationId: verification.id,
          message: successMessage,
          isResubmission
        });
      }

      // Handle individual image URL saving (for QR uploads)
      imageUrl = body.imageUrl;

      if (!imageUrl) {
        return NextResponse.json(
          { error: 'No image URL provided' },
          { status: 400 }
        );
      }

      if (!type || !['studentId', 'selfie'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid upload type. Must be "studentId" or "selfie"' },
          { status: 400 }
        );
      }
    } else {
      // Handle FormData request (direct file upload)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      type = formData.get('type') as string;

      // Validate inputs
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      if (!type || !['studentId', 'selfie'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid upload type. Must be "studentId" or "selfie"' },
          { status: 400 }
        );
      }

      // Check file size (10MB limit for verification files)
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
      const fileName = generateUniqueFilename(file.name, type);
      
      // Define public directory path for storing the image
      const publicDir = path.join(process.cwd(), 'public');
      const uploadsDir = path.join(publicDir, 'uploads', 'verification');
      const filePath = path.join(uploadsDir, fileName);

      // Ensure the verification uploads directory exists
      try {
        mkdirSync(uploadsDir, { recursive: true });
      } catch {
        // Directory might already exist, that's ok
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

      // In the new flow, we don't save to database immediately
      // Just return the URL for the frontend to use later
      return NextResponse.json({ 
        url: imageUrl,
        type,
        message: `${type === 'studentId' ? 'Student ID' : 'Selfie'} uploaded successfully and ready for submission`
      });
    }

  } catch (error) {
    console.error('Error handling verification file upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload verification file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);

    // Get user's verification status
    const verification = await prisma.studentVerification.findUnique({
      where: { userId }
    });

    return NextResponse.json({ verification });

  } catch (error) {
    console.error('Error fetching verification status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
} 