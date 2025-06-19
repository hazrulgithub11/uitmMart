import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://uitmmart.site';
    const cleanBaseUrl = baseUrl.replace(/['"]+/g, '');
    const healthUrl = `${cleanBaseUrl}/health`;
    
    console.log('Checking socket server health at:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.log('Socket server health check failed:', response.status, response.statusText);
      return NextResponse.json(
        { status: 'error', message: 'Socket server is not responding' },
        { status: 503 }
      );
    }
    
    const data = await response.text();
    console.log('Socket server health check succeeded:', data);
    
    return NextResponse.json(
      { status: 'success', message: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking socket server status:', error);
    
    return NextResponse.json(
      { status: 'error', message: 'Socket server is not available' },
      { status: 503 }
    );
  }
} 