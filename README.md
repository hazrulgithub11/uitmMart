This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tracking Integration

This project includes integration with tracking.my API for automatic courier detection and tracking status updates:

### Setting Up Tracking.my API

1. Register for a seller account at [tracking.my](https://tracking.my/)
2. Navigate to your API settings page to get your API key
3. Add your API key to the `.env.local` file:

```
TRACKING_MY_API_KEY="your-tracking-my-api-key"
```

4. Restart your server after adding the API key

### Troubleshooting Webhook Registration

If you see the "Failed to register webhook" error in the admin dashboard, check the following:

1. Verify that you have set up the `TRACKING_MY_API_KEY` in your `.env.local` file
2. Make sure your application is deployed to a publicly accessible URL (tracking.my cannot send webhooks to localhost)
3. Check that your API key is valid and has permission to register webhooks
4. If still having issues, contact tracking.my support with your API key details

### Automatic Courier Detection

The system automatically detects courier services when a tracking number is entered in the seller dashboard:

1. Enter a tracking number when updating an order
2. The system will call tracking.my API to detect the courier
3. The detected courier information will be displayed and saved with the order

### Webhook Integration

For automatic order status updates based on tracking status:

1. Deploy your application to a publicly accessible URL
2. Access the admin tracking page at `/admin/tracking`
3. Register your webhook URL with tracking.my
4. The system will automatically update order statuses when tracking statuses change

## Learn More

## Admin credentials

adminEmail = 'admin@uitmmart.com';
adminPassword = 'Admin@123';
adminUsername = 'admin';

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
