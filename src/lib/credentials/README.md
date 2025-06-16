# Gmail API Setup Guide

This guide will help you set up the Gmail API for sending emails from your UiTM Mart application.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make note of your project ID

## Step 2: Enable the Gmail API

1. In your Google Cloud project, go to the [API Library](https://console.cloud.google.com/apis/library)
2. Search for "Gmail API"
3. Click on "Gmail API" and then click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" and select "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: UiTM Mart
   - User support email: Your email
   - Developer contact information: Your email
   - Authorized domains: Your domain
4. For application type, select "Desktop app"
5. Name your OAuth client (e.g., "UiTM Mart Desktop Client")
6. Click "Create"
7. Download the JSON file

## Step 4: Set Up Credentials in Your Application

1. Rename the downloaded JSON file to `credentials.json`
2. Place it in the `src/lib/credentials` directory of your project

## Step 5: First Run and Authentication

1. The first time you run the application and try to send an email, you'll be prompted to authenticate in a browser
2. Follow the prompts to allow your application access to your Gmail account
3. After authentication, a `token.json` file will be created in the credentials directory
4. This token will be used for future email sending without requiring re-authentication

## Important Notes

- The Gmail API has usage limits. For production use with high volume, consider using a dedicated email service.
- Keep your credentials secure and do not commit them to version control.
- The email will be sent from the Google account that you authenticate with.

## Troubleshooting

If you encounter any issues:
1. Verify that the Gmail API is enabled in your Google Cloud project
2. Ensure your credentials.json file is correctly placed in the credentials directory
3. Check that your application has the necessary scopes (https://www.googleapis.com/auth/gmail.send)
4. If authentication fails, delete the token.json file and try again 