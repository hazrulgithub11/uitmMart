// Utility to find and fix plaintext passwords
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function fixPlaintextPasswords() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    
    console.log(`Found ${users.length} users in the database`);
    let fixedCount = 0;
    
    for (const user of users) {
      const { id, email, password } = user;
      
      // Check if the password is in bcrypt format
      const isBcryptHash = password.startsWith('$2b$') || password.startsWith('$2a$');
      
      if (!isBcryptHash) {
        console.log(`User ${id} (${email}) has a password that is NOT in bcrypt format!`);
        
        // Hash the plaintext password
        const hashedPassword = await hash(password, 10);
        
        // Update the user's password
        await prisma.user.update({
          where: { id },
          data: { password: hashedPassword }
        });
        
        console.log(`FIXED: Hashed the password for user ${id} (${email})`);
        fixedCount++;
      }
    }
    
    if (fixedCount === 0) {
      console.log("All passwords are already properly hashed. No changes needed.");
    } else {
      console.log(`Fixed ${fixedCount} plaintext passwords.`);
    }
  } catch (error) {
    console.error('Error fixing passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPlaintextPasswords(); 