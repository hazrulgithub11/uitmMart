import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tracking number from the query parameters
    const { searchParams } = new URL(req.url);
    const trackingNumber = searchParams.get('trackingNumber');
    
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.TRACKING_MY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Tracking API key not configured' },
        { status: 500 }
      );
    }

    console.log(`Detecting courier for tracking number: ${trackingNumber}`);
    
    // First, try to get the list of couriers
    try {
      console.log('Fetching list of couriers');
      const couriersUrl = 'https://seller.tracking.my/api/v1/couriers?is_active=false';
      
      const couriersResponse = await fetch(couriersUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Tracking-Api-Key': apiKey
        }
      });
      
      if (!couriersResponse.ok) {
        console.log(`Couriers API response status: ${couriersResponse.status}`);
        const responseText = await couriersResponse.text();
        console.log('Couriers API response:', responseText.substring(0, 200));
        throw new Error(`Failed to fetch couriers: ${couriersResponse.status}`);
      }
      
      const couriersData = await couriersResponse.json();
      console.log(`Retrieved ${couriersData.data?.length || 0} couriers`);
      
      // Now try to detect the courier for the tracking number
      // Since there's no specific detect endpoint in v1, we'll try to match the tracking number pattern
      // against the courier patterns from the list
      if (couriersData.data && Array.isArray(couriersData.data)) {
        const possibleCouriers = [];
        
        for (const courier of couriersData.data) {
          if (courier.tracking_pattern) {
            try {
              const pattern = new RegExp(courier.tracking_pattern);
              if (pattern.test(trackingNumber)) {
                possibleCouriers.push({
                  courier_code: courier.code,
                  courier_name: courier.name
                });
              }
            } catch {
              // Invalid regex pattern, skip this courier
              console.log(`Invalid regex pattern for courier ${courier.name}: ${courier.tracking_pattern}`);
            }
          }
        }
        
        if (possibleCouriers.length > 0) {
          return NextResponse.json({
            success: true,
            data: possibleCouriers,
            source: 'pattern_matching'
          });
        }
      }
      
      // If we couldn't detect using patterns, try a direct API call
      // Try the v1 tracking endpoint as a fallback
      console.log('Trying direct API call to detect courier');
      
      // For Shopee Express (SPX) specifically
      if (trackingNumber.startsWith('SPXMY')) {
        return NextResponse.json({
          success: true,
          data: [{
            courier_code: 'shopee-express-my',
            courier_name: 'Shopee Express'
          }],
          source: 'prefix_matching'
        });
      }
      
      // Try creating a tracking to see if the API can detect the courier
      const detectUrl = 'https://seller.tracking.my/api/v1/trackings/detect';
      
      const detectResponse = await fetch(`${detectUrl}?tracking_number=${encodeURIComponent(trackingNumber)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Tracking-Api-Key': apiKey
        }
      });
      
      if (detectResponse.ok) {
        const detectData = await detectResponse.json();
        if (detectData && detectData.courier) {
          return NextResponse.json({
            success: true,
            data: [{
              courier_code: detectData.courier.code || detectData.courier.courier_code,
              courier_name: detectData.courier.name || detectData.courier.courier_name
            }],
            source: 'api_detection'
          });
        }
      }
      
      // If all detection methods fail
      console.log('Could not detect courier for tracking number');
      return NextResponse.json(
        { 
          error: 'Failed to detect courier', 
          message: 'Could not detect courier service. Please select manually.'
        },
        { status: 404 }
      );
    } catch (error) {
      console.error('Error detecting courier:', error);
      return NextResponse.json(
        { 
          error: 'Failed to detect courier', 
          details: (error instanceof Error ? error.message : String(error)),
          message: 'Could not detect courier service. Please select manually.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in courier detection route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to detect courier', 
        details: (error instanceof Error ? error.message : String(error)),
        message: 'Could not detect courier service. Please select manually.'
      },
      { status: 500 }
    );
  }
} 