import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://uitmmart.site';
    const response = await fetch(`${socketUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Socket server is not responding' },
        { status: 503 }
      );
    }
    
    const data = await response.text();
    
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