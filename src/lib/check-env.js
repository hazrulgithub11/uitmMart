// Utility to check environment variables
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

console.log('==== Environment Variables ====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET present:', !!process.env.NEXTAUTH_SECRET);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('NEXTAUTH_SECRET (masked):', process.env.NEXTAUTH_SECRET ? 
  process.env.NEXTAUTH_SECRET.substring(0, 5) + '...' : undefined);
console.log('=============================='); 