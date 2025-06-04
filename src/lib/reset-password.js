// Utility to reset a user's password
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword(email, newPassword) {
  try {
    if (!email || !newPassword) {
      console.error('Email and new password are required');
      return;
    }
    
    console.log(`Attempting to reset password for user: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);
    
    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    console.log(`Successfully reset password for user: ${email}`);
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const userEmail = process.argv[2];
const newPassword = process.argv[3];

if (!userEmail || !newPassword) {
  console.log('Usage: node reset-password.js <email> <newPassword>');
} else {
  resetPassword(userEmail, newPassword);
} 