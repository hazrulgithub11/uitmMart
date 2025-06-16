import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import path from 'path';
import fs from 'fs';
import { Order, OrderItem, User } from '@prisma/client';

// Path to credentials directory
const CREDENTIALS_PATH = path.join(process.cwd(), 'src/lib/credentials');
const TOKEN_PATH = path.join(CREDENTIALS_PATH, 'token.json');
const CREDENTIALS_FILE = path.join(CREDENTIALS_PATH, 'credentials.json');

// Gmail API scopes
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Format currency to Malaysian Ringgit
const formatCurrency = (amount: number): string => {
  return `RM ${amount.toFixed(2)}`;
};

// Format date
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get authenticated Gmail client
 */
async function getGmailClient() {
  // Check if credentials file exists
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    throw new Error(`Credentials file not found at: ${CREDENTIALS_FILE}`);
  }
  
  try {
    // Read credentials file
    const credentialsContent = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    // Get client ID and secret based on credential type (web or installed)
    const credentialType = credentials.web ? 'web' : 'installed';
    if (!credentials[credentialType]) {
      throw new Error('Invalid credentials format. Expected "web" or "installed" property.');
    }
    
    const { client_id, client_secret, redirect_uris } = credentials[credentialType];
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    // Check if we have a token file
    if (fs.existsSync(TOKEN_PATH)) {
      const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf8');
      const token = JSON.parse(tokenContent);
      
      // Check if token is expired
      const expiryDate = token.expiry_date;
      const now = Date.now();
      
      if (expiryDate && expiryDate < now) {
        // Use the refresh token to get a new access token
        if (!token.refresh_token) {
          throw new Error('No refresh token found. Please re-authenticate.');
        }
        
        // Set the refresh token in the OAuth client
        oAuth2Client.setCredentials({
          refresh_token: token.refresh_token
        });
        
        // Get new access token and update token file
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              client_id: client_id,
              client_secret: client_secret,
              refresh_token: token.refresh_token,
              grant_type: 'refresh_token'
            })
          });
          
          const newTokens = await response.json();
          
          // Update token file with new access token
          const updatedToken = {
            ...token,
            access_token: newTokens.access_token,
            expiry_date: Date.now() + (newTokens.expires_in * 1000)
          };
          
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedToken, null, 2));
          
          // Set the updated credentials
          oAuth2Client.setCredentials(updatedToken);
        } catch (error) {
          console.error('Error refreshing access token:', error);
          throw error;
        }
      } else {
        // Token is still valid, use it
        oAuth2Client.setCredentials(token);
      }
      
      return oAuth2Client;
    } else {
      // For new installations, use authenticate() to get a new token
      const client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_FILE,
      });

      // Store the token for future use
      if (client.credentials) {
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(client.credentials));
      }
      
      return client;
    }
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
}

/**
 * Create and encode email message
 */
function createMessage(to: string, subject: string, html: string) {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ];
  
  const email = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  return encodedEmail;
}

// Interface for sending order confirmation email
interface OrderConfirmationEmailData {
  order: Order & {
    items: (OrderItem & {
      productName: string;
      productImage?: string | null;
    })[];
    buyer: User;
  };
}

// Send order confirmation email
export async function sendOrderConfirmationEmail({
  order,
}: OrderConfirmationEmailData): Promise<void> {
  try {
    if (!order.buyer.email) {
      console.error('No buyer email found for order:', order.id);
      return;
    }

    // Create items HTML
    const itemsHtml = order.items
      .map((item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(Number(item.unitPrice))}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(Number(item.totalPrice))}</td>
        </tr>
      `)
      .join('');

    // Email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://uitm.edu.my/images/images/UiTM/Logo/logo.jpg" alt="UiTM Mart Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #3b0c6e; text-align: center; margin-bottom: 20px;">Thank you for your purchase!</h1>
        <p style="margin-bottom: 20px;">Dear ${order.buyer.fullName},</p>
        <p style="margin-bottom: 20px;">Your payment was successful. Here are your order details:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Order ID:</strong> ${order.orderNumber}</p>
          <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
          <p><strong>Total Amount:</strong> ${formatCurrency(Number(order.totalAmount))}</p>
        </div>
        
        <h2 style="color: #3b0c6e; margin-bottom: 15px;">Purchased Items</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Quantity</th>
              <th style="padding: 10px; text-align: right;">Unit Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>${formatCurrency(Number(order.totalAmount))}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <p style="margin-bottom: 20px;">You can track your order status in your account dashboard.</p>
        <p style="margin-bottom: 20px;">If you have any questions, please contact our customer support.</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} UiTM Mart. All rights reserved.</p>
        </div>
      </div>
    `;

    // Get Gmail client
    const auth = await getGmailClient();
    
    // Create Gmail client
    const gmail = google.gmail({
      version: 'v1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auth: auth as any
    });
    
    // Create message
    const encodedMessage = createMessage(
      order.buyer.email,
      `Order Confirmation #${order.orderNumber}`,
      emailContent
    );

    // Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`Order confirmation email sent to ${order.buyer.email} for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
}

// Test email service
export async function sendTestEmail(to: string): Promise<void> {
  try {
    // Get Gmail client
    const auth = await getGmailClient();
    
    // Create Gmail client
    const gmail = google.gmail({
      version: 'v1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auth: auth as any
    });
    
    // Create message
    const encodedMessage = createMessage(
      to,
      'Test Email from UiTM Mart',
      '<p>This is a test email from UiTM Mart.</p>'
    );
    
    // Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    console.log(`Test email sent to ${to}`);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
} 