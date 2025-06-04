import nodemailer from 'nodemailer';
import { Order, OrderItem, User } from '@prisma/client';

// Configure nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hazrulsehebat@gmail.com',
    pass: 'ijso gwdy esxk jfoe', // App password
  },
});

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

    // Send email
    await transporter.sendMail({
      from: '"UiTM Mart" <hazrulsehebat@gmail.com>',
      to: order.buyer.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      html: emailContent,
    });

    console.log(`Order confirmation email sent to ${order.buyer.email} for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
}

// Test email service
export async function sendTestEmail(to: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: '"UiTM Mart" <hazrulsehebat@gmail.com>',
      to,
      subject: 'Test Email from UiTM Mart',
      html: '<p>This is a test email from UiTM Mart.</p>',
    });
    console.log(`Test email sent to ${to}`);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
} 