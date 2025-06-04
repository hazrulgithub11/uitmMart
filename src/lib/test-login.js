// Utility to directly test the login process without using the UI
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin(email, password) {
  try {
    console.log(`Testing login for: ${email}`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error('Error: User not found');
      return false;
    }

    console.log('User found. Checking password...');
    
    // Compare passwords
    const isPasswordValid = await compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('✓ LOGIN SUCCESS');
      console.log('User details:');
      console.log({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });
      return true;
    } else {
      console.error('✗ LOGIN FAILED: Invalid password');
      return false;
    }
  } catch (error) {
    console.error('Error during login test:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node test-login.js <email> <password>');
} else {
  testLogin(email, password);
} 