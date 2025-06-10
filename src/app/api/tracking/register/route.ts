import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * API endpoint to register a tracking number with tracking.my
 * This is required before we can track shipments
 */
export async function POST(request: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.TRACKING_MY_API_KEY;
    
    if (!apiKey) {
      console.error('TRACKING_MY_API_KEY is not set in environment variables');
      return NextResponse.json(
        { success: false, error: 'Tracking API key is not configured' },
        { status: 500 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { tracking_number, courier, orderId } = body;
    
    // Validate input
    if (!tracking_number || !courier) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tracking_number and courier are required' 
        },
        { status: 400 }
      );
    }
    
    console.log(`Registering tracking number: ${tracking_number} with courier: ${courier}`);
    
    // Make request to tracking.my API
    const response = await fetch('https://seller.tracking.my/api/v1/trackings', {
      method: 'POST',
      headers: {
        'Tracking-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        tracking_number: tracking_number,
        courier: courier
      })
    });
    
    // Get response data
    const responseData = await response.json();
    
    // Log response for debugging
    console.log('Tracking.my API response:', responseData);
    
    // Extract short_link from the response
    let shortLink = null;
    if (responseData.tracking && responseData.tracking.short_link) {
      shortLink = responseData.tracking.short_link;
      console.log(`Extracted short_link: ${shortLink}`);
      
      // If orderId is provided, update the order with the shortLink
      if (orderId) {
        try {
          await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { shortLink }
          });
          console.log(`Updated order ${orderId} with short link: ${shortLink}`);
        } catch (error) {
          console.error('Failed to update order with short link:', error);
          // Continue anyway, this is not a critical failure
        }
      }
    }
    
    // Check if registration was successful
    if (!response.ok) {
      // If the tracking number is already registered, consider it a success
      if (responseData.meta?.error_message?.includes('already exists')) {
        // Try to get the existing tracking info to extract the short_link
        try {
          const existingTrackingResponse = await fetch(`https://seller.tracking.my/api/v1/trackings/${courier}/${tracking_number}`, {
            method: 'GET',
            headers: {
              'Tracking-Api-Key': apiKey,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          const existingTrackingData = await existingTrackingResponse.json();
          
          if (existingTrackingData.tracking && existingTrackingData.tracking.short_link) {
            shortLink = existingTrackingData.tracking.short_link;
            console.log(`Retrieved short_link for existing tracking: ${shortLink}`);
            
            // Update order if orderId is provided
            if (orderId) {
              try {
                await prisma.order.update({
                  where: { id: parseInt(orderId) },
                  data: { shortLink }
                });
                console.log(`Updated order ${orderId} with short link: ${shortLink}`);
              } catch (error) {
                console.error('Failed to update order with short link:', error);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch existing tracking details:', error);
        }
        
        return NextResponse.json({
          success: true,
          message: 'Tracking number already registered',
          shortLink,
          data: responseData
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: responseData.meta?.error_message || 'Failed to register tracking number',
          data: responseData
        },
        { status: response.status }
      );
    }
    
    // Return success response with short_link
    return NextResponse.json({
      success: true,
      message: 'Tracking number registered successfully',
      shortLink,
      data: responseData
    });
    
  } catch (error) {
    console.error('Error in tracking registration API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 