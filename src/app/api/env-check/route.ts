import { NextResponse } from 'next/server';

export async function GET() {
  // Check important environment variables for Stripe integration
  const envVars = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? '✅ Set' : '❌ Missing',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ? '✅ Set' : '❌ Missing',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    NODE_ENV: process.env.NODE_ENV || 'Not set',
  };

  // Get base URL detection - check both environment variables
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
  const detectedBaseUrl = baseUrl 
    ? baseUrl
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
  const usedEnvVar = process.env.NEXT_PUBLIC_APP_URL 
    ? 'NEXT_PUBLIC_APP_URL' 
    : (process.env.NEXT_PUBLIC_BASE_URL ? 'NEXT_PUBLIC_BASE_URL' : 'None (using fallback)');

  // Get webhook endpoint for debugging
  const webhookEndpoint = `${detectedBaseUrl}/api/webhook/stripe`;

  // Return the environment variables status and other useful information
  return NextResponse.json({
    env: envVars,
    webhookEndpoint,
    detectedBaseUrl,
    usedEnvVar,
    timestamp: new Date().toISOString(),
  });
} 