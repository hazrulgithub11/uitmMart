import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get the current user session - only admin should be able to check API key status
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if API key is configured
    const apiKey = process.env.TRACKING_MY_API_KEY;
    console.log('API key check:', {
      exists: !!apiKey,
      value: apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}` : 'undefined',
      nextEnvVar: process.env.NEXT_PUBLIC_BASE_URL || 'not found'
    });
    
    return NextResponse.json({
      isConfigured: !!apiKey,
      message: apiKey 
        ? 'Tracking API key is configured' 
        : 'Tracking API key is not configured',
      apiKeyInfo: apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}` : null
    });
  } catch (error) {
    console.error('Error checking API key status:', error);
    return NextResponse.json(
      { error: 'Failed to check API key status', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 