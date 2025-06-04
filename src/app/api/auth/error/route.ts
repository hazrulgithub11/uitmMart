import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');

  // Return a JSON response with the error
  return NextResponse.json({ 
    error: error || 'Authentication error', 
    message: 'An error occurred during authentication.' 
  });
} 