// Simple bcrypt test file
import { hash, compare } from 'bcrypt';

async function testBcrypt() {
  try {
    const password = 'test-password';
    console.log('Original password:', password);
    
    const hashedPassword = await hash(password, 10);
    console.log('Hashed password:', hashedPassword);
    
    const isMatch1 = await compare(password, hashedPassword);
    console.log('Password comparison (correct):', isMatch1);
    
    const isMatch2 = await compare('wrong-password', hashedPassword);
    console.log('Password comparison (incorrect):', isMatch2);
  } catch (error) {
    console.error('Error testing bcrypt:', error);
  }
}

testBcrypt(); 