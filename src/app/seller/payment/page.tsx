'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertCircle, CheckCircle, ExternalLink, Info, Copy, Check } from 'lucide-react';
import Link from 'next/link';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]",
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full px-3 py-2"
};

export default function SellerPaymentPage() {
  const [loading, setLoading] = useState(true); // Start with loading true
  const [stripeConnected, setStripeConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<{
    card_payments?: string;
    transfers?: string;
    [key: string]: string | undefined;
  } | null>(null);
  const [webhookSetup, setWebhookSetup] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Base URL for the webhook
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://f66e-2001-d08-e1-1268-b15d-8c18-a27f-6f81.ngrok-free.app';
  
  const webhookUrl = `${baseUrl}/api/webhook/stripe`;
  
  // Function to copy webhook URL
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle webhook setup checkbox
  const handleWebhookSetupChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebhookSetup(e.target.checked);
    // Here you could also update the seller record in your database
    try {
      await fetch('/api/seller/stripe/update-webhook-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookSetup: e.target.checked })
      });
    } catch (err) {
      console.error('Failed to update webhook status:', err);
    }
  };
  
  // Check if seller already has a Stripe account connected
  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        const response = await fetch('/api/seller/stripe/status');
        
        if (response.ok) {
          const data = await response.json();
          if (data.connected && data.accountId) {
            setStripeConnected(true);
            setStripeAccountId(data.accountId);
            setCapabilities(data.capabilities);
            setWebhookSetup(data.webhookSetup || false);
          }
        }
      } catch (error) {
        console.error('Error checking Stripe status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkStripeStatus();
  }, []);
  
  // URL parameters
  useEffect(() => {
    // Check URL for success or error parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setStripeConnected(true);
      // Refresh the page status to get the latest account info
      window.location.href = '/seller/payment';
    } else if (urlParams.get('error') === 'true') {
      setError('There was an error connecting your Stripe account. Please try again.');
      setLoading(false);
    }
  }, []);

  // Handle Stripe connection
  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the API endpoint which will create an account and onboarding link
      const response = await fetch('/api/seller/stripe/create-account', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No redirect URL returned from API');
        }
      } else {
        let errorMessage = 'Failed to create Stripe account';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        setError(errorMessage);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className={`${cartoonStyle.heading} mb-8 text-black`}>Payment Settings</h1>

      {/* API Status Alert */}
      <div className="bg-blue-50 border-3 border-black rounded-lg p-4 mb-6 flex items-start">
        <Info className="h-6 w-6 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-blue-700">
            API Implementation Note
          </p>
          <p className="text-blue-600 text-sm mt-1">
            The Stripe Connect integration requires additional API setup and database migration. This page shows the UI design and explains how the integration will work.
          </p>
        </div>
      </div>

      {/* Stripe Connect Status Card */}
      <div className={`${cartoonStyle.card} mb-8`}>
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-2 rounded-lg mr-4 border-2 border-black">
            <CreditCard className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-black">Stripe Connect Integration</h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-3 border-black rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <p className="font-medium text-red-700">{error}</p>
            </div>
            <p className="mt-2 text-sm text-red-600">
              Please make sure your environment variables are set correctly, particularly STRIPE_SECRET_KEY.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center my-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : stripeConnected ? (
          <>
            <div className="bg-green-50 border-3 border-black rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <p className="font-medium text-green-700">
                  Your Stripe account is connected!
                </p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-600">Account ID: {stripeAccountId}</p>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-black">Account Capabilities:</h3>
                <ul className="grid grid-cols-2 gap-2">
                  <li className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                    <span>Card Payments: {capabilities?.card_payments || 'active'}</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                    <span>Transfers: {capabilities?.transfers || 'active'}</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4">
                <Link href="https://dashboard.stripe.com" target="_blank" className="flex items-center text-blue-600 hover:underline">
                  <span>Go to Stripe Dashboard</span>
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {/* Manual Webhook Setup Instructions */}
            <div className="bg-amber-50 border-3 border-black rounded-lg p-4 mb-6">
              <h3 className="font-bold text-amber-800 text-lg mb-3">Important: Set Up Webhook in Stripe Dashboard</h3>
              <p className="text-amber-700 mb-4">
                To receive payment notifications, you need to manually set up a webhook in your Stripe Dashboard.
                Please follow these steps:
              </p>
              
              <ol className="list-decimal pl-5 mb-4 space-y-2 text-amber-700">
                <li>Go to your <Link href="https://dashboard.stripe.com/webhooks" className="text-blue-600 underline" target="_blank">Stripe Dashboard → Developers → Webhooks</Link></li>
                <li>Click &quot;+ Add endpoint&quot;</li>
                <li>
                  For the Endpoint URL, copy and paste this: 
                  <div className="flex items-center bg-white rounded border-2 border-amber-300 p-2 my-1">
                    <code className="text-sm flex-1 select-all">{webhookUrl}</code>
                    <button 
                      onClick={copyWebhookUrl}
                      className="ml-2 p-1 bg-amber-100 rounded hover:bg-amber-200"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-amber-600" />}
                    </button>
                  </div>
                </li>
                <li>Under &quot;Events to send&quot;, select these events:
                  <ul className="list-disc pl-5 my-1">
                    <li><code>checkout.session.completed</code></li>
                    <li><code>payment_intent.succeeded</code></li>
                    <li><code>payment_intent.payment_failed</code></li>
                  </ul>
                </li>
                <li>Click &quot;Add endpoint&quot;</li>
              </ol>
              
              <div className="mt-4 flex items-center">
                <input 
                  type="checkbox" 
                  id="webhookSetup" 
                  checked={webhookSetup}
                  onChange={handleWebhookSetupChange}
                  className="mr-2 h-5 w-5 rounded border-black"
                />
                <label htmlFor="webhookSetup" className="font-medium text-amber-800">
                  I&apos;ve completed the webhook setup in my Stripe Dashboard
                </label>
              </div>
              
              <div className="mt-4 text-sm text-amber-700">
                <p>
                  <strong>Why this is necessary:</strong> Due to Stripe Connect limitations in Malaysia, 
                  we can&apos;t automatically set up webhooks for your account. This manual step ensures
                  you receive payment notifications correctly.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border-3 border-black rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
              <p className="font-medium text-yellow-700">
                You need to connect a Stripe account to receive payments
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-bold mb-3 text-black">How UitmMart & Stripe Work Together</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 border-3 border-black rounded-lg p-4">
              <h4 className="font-bold mb-2 text-black">Direct Payments to Your Bank Account</h4>
              <p className="text-gray-700">
                When customers pay for your products, money goes directly to your Stripe account and then to your bank account. UitmMart doesn&apos;t hold your funds.
              </p>
            </div>
            <div className="bg-gray-50 border-3 border-black rounded-lg p-4">
              <h4 className="font-bold mb-2 text-black">Platform Fee</h4>
              <p className="text-gray-700">
                UitmMart charges a small platform fee (5%) on each transaction, which is automatically collected by Stripe. You receive the remaining amount.
              </p>
            </div>
            <div className="bg-gray-50 border-3 border-black rounded-lg p-4">
              <h4 className="font-bold mb-2 text-black">Secure and Compliant</h4>
              <p className="text-gray-700">
                Stripe handles all security, PCI compliance, and payment processing. Your customer&apos;s payment information is never stored on UitmMart servers.
              </p>
            </div>
          </div>
        </div>

        {!stripeConnected && (
          <Button 
            onClick={handleConnectStripe} 
            disabled={loading}
            className={`${cartoonStyle.buttonPrimary} px-6 py-3 text-lg flex items-center`}
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                <span>Connect with Stripe</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* FAQ Section */}
      <div className={`${cartoonStyle.card}`}>
        <h3 className="text-xl font-bold mb-4 text-black">Frequently Asked Questions</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-black">What&apos;s Stripe Connect?</h4>
            <p className="text-gray-700 mt-1">
              Stripe Connect allows UitmMart to facilitate payments between your customers and your business. It&apos;s like having your own payment system without the hassle of building one.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-black">Do I need to create a new Stripe account?</h4>
            <p className="text-gray-700 mt-1">
              If you don&apos;t have a Stripe account yet, you&apos;ll create one during the connection process. If you already have one, you can link it to UitmMart.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-black">When will I receive my money?</h4>
            <p className="text-gray-700 mt-1">
              By default, Stripe transfers money to your bank account on a 2-day rolling basis. You can adjust this schedule in your Stripe Dashboard.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-black">Are there any fees?</h4>
            <p className="text-gray-700 mt-1">
              UitmMart charges a 5% platform fee on each transaction. Stripe also charges standard payment processing fees (typically 2.9% + $0.30 per successful card payment).
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-black">What information will I need to provide?</h4>
            <p className="text-gray-700 mt-1">
              To comply with financial regulations, you&apos;ll need to provide your personal information, business details, and banking information during the Stripe Connect onboarding process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

