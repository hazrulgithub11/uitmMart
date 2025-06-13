import { NextResponse } from 'next/server';

export async function GET() {
  // Safely redact sensitive information by showing only first few characters
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'not set';
  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'not set';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'not set';
  
  // Show first 8 chars of keys to verify they exist but are masked for security
  const maskedSecretKey = stripeSecretKey !== 'not set' 
    ? `${stripeSecretKey.substring(0, 8)}...` 
    : 'not set';
  
  const maskedPublicKey = stripePublicKey !== 'not set'
    ? `${stripePublicKey.substring(0, 8)}...`
    : 'not set';

  console.log({
    STRIPE_SECRET_KEY: maskedSecretKey,
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: maskedPublicKey,
    NEXT_PUBLIC_BASE_URL: baseUrl,
  });

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    variables: {
      STRIPE_SECRET_KEY: maskedSecretKey,
      NEXT_PUBLIC_STRIPE_PUBLIC_KEY: maskedPublicKey,
      NEXT_PUBLIC_BASE_URL: baseUrl,
    },
    // Help diagnose the URL mismatch issue with Stripe
    stripeRedirectUrls: {
      refreshUrl: `${baseUrl}/seller/payment?error=true`,
      returnUrl: `${baseUrl}/seller/payment?success=true`,
    }
  });
} 