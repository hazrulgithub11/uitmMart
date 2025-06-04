import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Test API endpoints to diagnose connection issues
const API_ENDPOINTS = {
  V1: 'https://api.tracking.my/v1/webhook',
  V2_SELLER: 'https://seller.tracking.my/api/v2/webhook',
  V2: 'https://api.tracking.my/v2/webhook'
};

type TestResult = {
  status?: number;
  statusText?: string;
  response?: unknown;
  success?: boolean;
  error?: string;
};

export async function POST(req: Request) {
  try {
    // Get the current user session - only admin should be able to register webhooks
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can register webhooks' },
        { status: 403 }
      );
    }
    
    // Get API key from environment variables
    const apiKey = process.env.TRACKING_MY_API_KEY;
    
    if (!apiKey) {
      console.log('API key environment variables check:', {
        exists: !!process.env.TRACKING_MY_API_KEY,
        value: process.env.TRACKING_MY_API_KEY ? `${process.env.TRACKING_MY_API_KEY.substring(0, 3)}...` : 'undefined'
      });
      
      return NextResponse.json(
        { error: 'Tracking API key not configured' },
        { status: 500 }
      );
    }
    
    // Get the webhook URL from the request body
    const { webhookUrl, debug = false } = await req.json();
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }
    
    console.log('Attempting to register webhook at URL:', webhookUrl);
    console.log('Using API key:', apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3));
    console.log('Debug mode:', debug ? 'enabled' : 'disabled');
    
    // Test all API endpoints to diagnose the issue
    const testResults: Record<string, TestResult> = {};
    
    try {
      // Test various API endpoint configurations to diagnose where the problem is
      for (const [name, url] of Object.entries(API_ENDPOINTS)) {
        console.log(`Testing ${name} endpoint: ${url}`);
        
        try {
          // Try different headers configurations
          const headers1 = {
            'Tracking-Api-Key': apiKey,
            'Accept': 'application/json'
          };
          
          const headers2 = {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          };
          
          const headers3 = {
            'x-api-key': apiKey,
            'Accept': 'application/json'
          };
          
          const testConfigs = [
            { name: `${name}-tracking-api-key`, headers: headers1 },
            { name: `${name}-bearer`, headers: headers2 },
            { name: `${name}-x-api-key`, headers: headers3 }
          ];
          
          for (const config of testConfigs) {
            try {
              const response = await fetch(url, {
                method: 'GET',
                headers: config.headers
              });
              
              const statusText = response.statusText || 'No status text';
              const status = response.status;
              
              const responseText = await response.text();
              let responseData: unknown;
              
              try {
                responseData = JSON.parse(responseText);
              } catch {
                responseData = { text: responseText };
              }
              
              testResults[config.name] = {
                status,
                statusText,
                response: responseData,
                success: response.ok
              };
              
              console.log(`Test ${config.name}: ${status} ${statusText}`);
            } catch (error: unknown) {
              console.error(`Test ${config.name} error:`, error);
              const errorMessage = error instanceof Error ? error.message : String(error);
              testResults[config.name] = { error: errorMessage };
            }
          }
        } catch (endpointError: unknown) {
          console.error(`Error testing ${name}:`, endpointError);
          const errorMessage = endpointError instanceof Error ? endpointError.message : String(endpointError);
          testResults[name] = { error: errorMessage };
        }
      }
      
      // If in debug mode, just return the test results without attempting to register
      if (debug) {
        return NextResponse.json({
          message: 'API test completed',
          apiKeyInfo: apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3),
          apiEndpointTests: testResults,
          debugMode: true
        });
      }
      
      // Now try the actual webhook registration with the most promising endpoint
      // Based on documentation, using v2 seller endpoint with PUT
      const response = await fetch('https://seller.tracking.my/api/v2/webhook', {
        method: 'PUT',
        headers: {
          'Tracking-Api-Key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: [
            "trackings/create", 
            "trackings/update", 
            "trackings/checkpoint_update"
          ],
          secret_key: apiKey.substring(0, 10) // Use part of the API key as secret
        }),
      });
      
      // Log full response for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let responseData: unknown;
      try {
        // Try to parse as JSON if possible
        responseData = JSON.parse(responseText);
        
        // For development: Log the full webhook response including secret key
        if (responseData && typeof responseData === 'object' && 'webhook' in responseData) {
          const webhook = (responseData as { webhook: { secret_key?: string } }).webhook;
          if (webhook && webhook.secret_key) {
            console.log('======= DEVELOPMENT ONLY =======');
            console.log('Webhook secret key (DO NOT LOG IN PRODUCTION):', webhook.secret_key);
            console.log('================================');
          }
        }
        
      } catch {
        // If not valid JSON, use the text as is
        responseData = { text: responseText };
      }
      
      if (!response.ok) {
        return NextResponse.json(
          { 
            error: 'Failed to register webhook', 
            details: responseData,
            status: response.status,
            request: {
              url: webhookUrl,
              events: ["trackings/create", "trackings/update", "trackings/checkpoint_update"]
            },
            apiEndpointTests: testResults
          },
          { status: response.status }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Webhook registration successful',
        data: responseData
      });
    } catch (error: unknown) {
      console.error('Error during fetch operation:', error);
      
      // Check for DNS resolution errors
      if (error instanceof Error && 'cause' in error) {
        const cause = error.cause as { code?: string; syscall?: string; hostname?: string };
        if (cause && cause.code === 'ENOTFOUND') {
          return NextResponse.json({
            error: 'Failed to connect to tracking.my API',
            details: 'Could not resolve the tracking.my domain. Please check your internet connection or if the API endpoint is correct.',
            technical: `${cause.syscall} ${cause.code} ${cause.hostname}`,
            apiEndpointTests: testResults
          }, { status: 500 });
        }
      }
      
      // Handle other fetch errors
      return NextResponse.json({
        error: 'Failed to connect to tracking.my API',
        details: error instanceof Error ? error.message : String(error),
        apiEndpointTests: testResults
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Error registering webhook:', error);
    return NextResponse.json(
      { error: 'Failed to register webhook', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 