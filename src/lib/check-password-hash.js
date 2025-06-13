// Utility to check if passwords are correctly hashed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPasswordHashes() {
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
    
    for (const user of users) {
      const { id, email, password } = user;
      
      // Check if the password is in bcrypt format
      const isBcryptHash = password.startsWith('$2b$') || password.startsWith('$2a$');
      
      console.log(`User ID: ${id}, Email: ${email}`);
      console.log(`Password hash: ${password.substring(0, 10)}...`);
      console.log(`Is bcrypt hash: ${isBcryptHash ? 'YES' : 'NO'}`);
      
      if (!isBcryptHash) {
        console.log(`WARNING: User ${id} (${email}) has a password that is NOT in bcrypt format!`);
        
        // Example of how to fix it (commented out for safety)
        // const hashedPassword = await hash(password, 10);
        // await prisma.user.update({
        //   where: { id },
        //   data: { password: hashedPassword }
        // });
        // console.log(`Fixed password for user ${id}`);
      }
      
      console.log('-------------------');
    }
  } catch (error) {
    console.error('Error checking password hashes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswordHashes(); 