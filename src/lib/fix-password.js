// Script to fix any unhashed passwords in the database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    console.log("Starting password fix script...");
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    
    console.log(`Found ${users.length} users in the database`);
    
    for (const user of users) {
      const { id, email, password } = user;
      
      // Check if the password is NOT in bcrypt format (doesn't start with $2b$ or $2a$)
      const isBcryptHash = password.startsWith('$2b$') || password.startsWith('$2a$');
      
      if (!isBcryptHash) {
        console.log(`User ${id} (${email}) has a password that is NOT in bcrypt format!`);
        
        // Create a hashed version of the current password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update the user record
        await prisma.user.update({
          where: { id },
          data: { password: hashedPassword }
        });
        
        console.log(`✅ Password fixed for user ${id} (${email})`);
      } else {
        console.log(`User ${id} (${email}) already has a properly hashed password`);
      }
    }
    
    console.log("Password fix script completed!");
  } catch (error) {
    console.error("Error fixing passwords:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixPasswords(); 