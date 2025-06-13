const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Starting admin user creation process...');
    
    // Check if admin already exists
    console.log('Checking for existing admin...');
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'admin'
      }
    });

    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      return;
    }

    // Admin credentials - you should change these
    const adminEmail = 'admin@uitmmart.com';
    const adminPassword = 'Admin@123';
    const adminUsername = 'admin';
    
    console.log('Creating admin with email:', adminEmail);

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log('Password hashed successfully');

    // Create the admin user
    console.log('Creating admin user in database...');
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'System Administrator',
        username: adminUsername,
        role: 'admin'
      }
    });

    console.log('Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Password: ${adminPassword} (not hashed)`);
    console.log(`Role: ${admin.role}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error.code === 'P2002') {
      console.error('A unique constraint would be violated. The user might already exist.');
    }
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

console.log('Starting script...');
createAdmin()
  .then(() => console.log('Script completed.'))
  .catch(err => console.error('Unhandled error:', err)); 