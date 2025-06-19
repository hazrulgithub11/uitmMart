import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the socket URL from environment or use default
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://uitmmart.site';
    console.log('[SOCKET-STATUS] Using socket URL:', socketUrl);
    
    // Clean the URL and ensure it doesn't end with a slash
    const cleanUrl = socketUrl.replace(/['"]+/g, '').replace(/\/$/, '');
    console.log('[SOCKET-STATUS] Cleaned URL:', cleanUrl);
    
    // Construct the health endpoint URL
    const healthUrl = `${cleanUrl}/health`;
    console.log('[SOCKET-STATUS] Checking health at:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error(`[SOCKET-STATUS] Health check failed with status: ${response.status}`);
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Socket server is not responding (${response.status})`,
          url: healthUrl
        },
        { status: 503 }
      );
    }
    
    const data = await response.text();
    console.log('[SOCKET-STATUS] Health check successful:', data);
    
    return NextResponse.json(
      { status: 'success', message: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SOCKET-STATUS] Error checking socket server status:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Socket server is not available',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 503 }
    );
  }
} 