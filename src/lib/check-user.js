// Utility to check a user in the database
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';

const prisma = new PrismaClient();

async function checkUser(email, password) {
  try {
    console.log('Looking for user with email:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('No user found with that email');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      passwordHash: user.password.substring(0, 10) + '...' // Show part of the hash for security
    });
    
    // Test password if provided
    if (password) {
      const isValid = await compare(password, user.password);
      console.log('Password match result:', isValid);
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const userEmail = process.argv[2];
const userPassword = process.argv[3];

if (!userEmail) {
  console.log('Usage: node check-user.js <email> [password]');
} else {
  checkUser(userEmail, userPassword);
} 