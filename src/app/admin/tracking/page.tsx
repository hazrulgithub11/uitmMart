'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

export default function TrackingAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'missing' | 'present'>('unknown');

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/tracking');
    }
  }, [status, session, router]);

  // Prefill the webhook URL with the current domain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const domain = window.location.origin;
      setWebhookUrl(`${domain}/api/tracking/webhook`);
      checkApiKeyStatus();
    }
  }, []);

  // Check if API key is configured
  const checkApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/tracking/check-api-key');
      const data = await response.json();
      setApiKeyStatus(data.isConfigured ? 'present' : 'missing');
    } catch (error) {
      console.error('Error checking API key status:', error);
      setApiKeyStatus('unknown');
    }
  };

  // Register the webhook
  const handleRegisterWebhook = async () => {
    setIsLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      const response = await fetch('/api/tracking/register-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to register webhook');
      }
      
      setSuccess('Webhook registered successfully! Your system will now receive automatic tracking updates.');
    } catch (error) {
      console.error('Error registering webhook:', error);
      setError(error instanceof Error ? error.message : 'Failed to register webhook');
    } finally {
      setIsLoading(false);
    }
  };

  // If loading or unauthorized, show appropriate UI
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="font-bold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md">
          <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don&apos;t have permission to access this admin page.</p>
          <Button 
            onClick={() => router.push('/')} 
            className={cartoonStyle.buttonPrimary}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header section */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className={`${cartoonStyle.button} text-black hover:bg-gray-100`}
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
          <Badge className="bg-purple-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">Admin</Badge>
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <div>
            <h1 className={`${cartoonStyle.heading} text-black`}>Tracking Webhook Setup</h1>
            <p className="text-gray-700 mt-1 font-medium">Configure automatic order status updates from tracking.my</p>
          </div>
        </div>
      </div>

      {/* API Key Status Card */}
      {apiKeyStatus !== 'present' && (
        <div className="max-w-4xl mx-auto mb-8">
          <Card className={`${cartoonStyle.card} border-red-500 bg-red-50`}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                API Key Not Configured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                The tracking.my API key is not configured. You need to add the API key to your environment variables before you can register webhooks.
              </p>
              <div className="bg-white p-4 rounded-lg border-2 border-black font-mono text-sm mb-4">
                <p>TRACKING_MY_API_KEY=&quot;your-api-key-from-tracking.my&quot;</p>
              </div>
              <p className="text-gray-700">
                Add this to your <code>.env.local</code> file, then restart the application.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhook Registration Card */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className={`${cartoonStyle.card} bg-white`}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black">Register Tracking.my Webhook</CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Set up automatic tracking status updates from tracking.my
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="font-bold text-black">Webhook URL</Label>
                <Input 
                  id="webhookUrl" 
                  placeholder="Enter webhook URL"
                  className={`${cartoonStyle.input} text-black`}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  This URL will receive tracking status updates from tracking.my
                </p>
              </div>

              {apiKeyStatus === 'present' && (
                <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4 flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-green-800">API key is configured. You can register the webhook.</p>
                </div>
              )}

              {success && (
                <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4 flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-bold">Error registering webhook:</p>
                    <p className="text-red-800">{error}</p>
                    <div className="mt-2">
                      <p className="text-red-700 text-sm font-medium">This could be due to:</p>
                      <ul className="list-disc pl-5 mt-1 text-red-700 text-sm">
                        <li>Invalid or missing API key</li>
                        <li>The webhook URL not being publicly accessible</li>
                        <li>Issues with the tracking.my API service</li>
                      </ul>
                      <div className="mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-800 border-red-300 hover:bg-red-50"
                          onClick={() => router.push('/admin/tracking/debug')}
                        >
                          Open Troubleshooting Tool
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleRegisterWebhook} 
              disabled={isLoading || !webhookUrl.trim() || apiKeyStatus !== 'present'}
              className={cartoonStyle.buttonPrimary}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Registering...
                </>
              ) : (
                'Register Webhook'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Webhook Information Card */}
      <div className="max-w-4xl mx-auto">
        <Card className={`${cartoonStyle.card} bg-white`}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-black">1. Register Your Webhook</h3>
                <p className="text-gray-700">
                  Click the &quot;Register Webhook&quot; button above to register your webhook URL with tracking.my.
                  This allows tracking.my to send tracking status updates to your system.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-black">2. Automatic Status Updates</h3>
                <p className="text-gray-700">
                  When a tracking status changes, tracking.my will send a webhook to your system,
                  and your orders will be automatically updated with the latest status.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-bold text-black">3. Webhook Events</h3>
                <p className="text-gray-700">
                  The system is subscribed to the following webhook events:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>&quot;trackings/create&quot; - When a new tracking is created</li>
                  <li>&quot;trackings/update&quot; - When a tracking is updated</li>
                  <li>&quot;trackings/checkpoint_update&quot; - When a tracking status changes</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-black">4. Status Mapping</h3>
                <p className="text-gray-700">
                  Tracking statuses are mapped to order statuses as follows:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>&quot;out_for_delivery&quot; → &quot;shipped&quot;</li>
                  <li>&quot;delivered&quot; → &quot;delivered&quot;</li>
                  <li>&quot;returned_to_sender&quot; → &quot;cancelled&quot;</li>
                </ul>
              </div>

              <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4">
                <h3 className="font-bold text-black mb-2">Important Notes</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>You need to have a valid tracking.my API key configured as TRACKING_MY_API_KEY in your environment variables.</li>
                  <li>Your webhook URL must be publicly accessible (not localhost) and use HTTPS.</li>
                  <li>The system automatically verifies webhook signatures using HMAC-SHA256 for security.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 