import { NextResponse } from 'next/server';

/**
 * This is a forwarding handler that redirects all Stripe webhook events
 * to the main webhook handler at /api/webhook/stripe.
 * 
 * We're keeping this endpoint for backward compatibility but all logic
 * is consolidated in the main webhook handler.
 */
export async function POST(req: Request) {
  console.log('Webhook received at /api/stripe/webhook - forwarding to main handler');
  
  try {
    // Clone the request to forward it
    const clonedBody = await req.text();
    const headers = new Headers();
    
    // Copy all headers from the original request
    req.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    
    // Create a new request to forward
    const forwardRequest = new Request(
      new URL('/api/webhook/stripe', req.url).toString(),
      {
        method: 'POST',
        headers: headers,
        body: clonedBody
      }
    );
    
    // Forward the request to the main webhook handler
    console.log('Forwarding request to main webhook handler');
    const response = await fetch(forwardRequest);
    
    // Return the response from the main handler
    const responseBody = await response.text();
    console.log(`Main handler responded with status: ${response.status}`);
    
    return new NextResponse(responseBody, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error('Error forwarding webhook request:', error);
    return NextResponse.json(
      { error: 'Error forwarding webhook request' },
      { status: 500 }
    );
  }
} 