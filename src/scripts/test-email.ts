import { sendTestEmail } from '../lib/emailService';

async function main() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('Please provide an email address: npm run test-email user@example.com');
    process.exit(1);
  }
  
  console.log(`Sending test email to ${testEmail}...`);
  
  try {
    await sendTestEmail(testEmail);
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Error sending test email:', error);
    process.exit(1);
  }
}

main(); 