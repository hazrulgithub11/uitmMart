import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const API_KEY = process.env.TRACKING_MY_API_KEY;

if (!API_KEY) {
  console.error('Error: TRACKING_MY_API_KEY is not set in environment variables');
  process.exit(1);
}

interface Courier {
  title: string;
  handle: string;
  website?: string;
  contact?: string;
  email?: string;
}

async function fetchCouriers(): Promise<Courier[]> {
  try {
    console.log('Fetching couriers from tracking.my API...');
    
    const response = await fetch('https://seller.tracking.my/api/v1/couriers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Tracking-Api-Key': API_KEY as string
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch couriers: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.couriers || !Array.isArray(data.couriers)) {
      throw new Error('Invalid response format: couriers array not found');
    }
    
    console.log(`Successfully fetched ${data.couriers.length} couriers`);
    return data.couriers;
  } catch (error) {
    console.error('Error fetching couriers:', error);
    throw error;
  }
}

async function saveCouriersToJson(couriers: Courier[]): Promise<void> {
  try {
    // Format couriers for our application
    const formattedCouriers = couriers.map(courier => ({
      code: courier.handle,
      name: courier.title,
      website: courier.website || null,
      contact: courier.contact || null,
      email: courier.email || null
    }));
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save to JSON file
    const filePath = path.join(dataDir, 'couriers.json');
    fs.writeFileSync(
      filePath,
      JSON.stringify(formattedCouriers, null, 2)
    );
    
    console.log(`Successfully saved ${formattedCouriers.length} couriers to ${filePath}`);
  } catch (error) {
    console.error('Error saving couriers to JSON:', error);
    throw error;
  }
}

async function main() {
  try {
    const couriers = await fetchCouriers();
    await saveCouriersToJson(couriers);
    console.log('Courier data fetching and saving completed successfully');
  } catch (error) {
    console.error('Failed to fetch or save courier data:', error);
    process.exit(1);
  }
}

// Run the script
main(); 