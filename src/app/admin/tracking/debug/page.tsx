'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, AlertCircle, ShieldAlert, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

export default function TrackingDebugPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  React.useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/');
      } else {
        // Pre-fill webhook URL
        if (typeof window !== 'undefined') {
          const domain = window.location.origin;
          setWebhookUrl(`${domain}/api/tracking/webhook`);
        }
        
        // Get current API key from environment
        checkApiKey();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/tracking/debug');
    }
  }, [status, session, router]);

  const checkApiKey = async () => {
    try {
      const response = await fetch('/api/tracking/check-api-key');
      const data = await response.json();
      
      if (data.apiKeyInfo) {
        setApiKey(data.apiKeyInfo);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    setResults(null);
    setError(null);
    
    try {
      const response = await fetch('/api/tracking/register-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          webhookUrl,
          debug: true 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to test API connection');
        setResults(data);
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error('Error testing API:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
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
            onClick={() => router.push('/admin/tracking')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracking Settings
          </Button>
          <Badge className="bg-purple-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">Debug</Badge>
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <div>
            <h1 className={`${cartoonStyle.heading} text-black`}>API Troubleshooting</h1>
            <p className="text-gray-700 mt-1 font-medium">Debug tracking.my API connection issues</p>
          </div>
        </div>
      </div>

      {/* API Connection Test Card */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className={`${cartoonStyle.card} bg-white`}>
          <CardHeader>
            <div className="flex items-center">
              <Terminal className="h-6 w-6 mr-2 text-blue-600" />
              <CardTitle className="text-xl font-bold text-black">Test API Connection</CardTitle>
            </div>
            <CardDescription className="text-gray-700 font-medium">
              Test your tracking.my API connection and diagnose issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="font-bold text-black">API Key</Label>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-lg border-2 border-gray-300 flex-1">
                    <p className="text-gray-700 font-mono">{apiKey || 'Not configured'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  This is your API key from the environment variables (partially hidden)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="font-bold text-black">Webhook URL to Register</Label>
                <Input 
                  id="webhookUrl" 
                  placeholder="Enter webhook URL"
                  className={`${cartoonStyle.input} text-black`}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {results && (
                <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4">
                  <h3 className="font-bold text-black mb-2">Test Results:</h3>
                  <Textarea
                    className="font-mono text-sm bg-black text-green-400 w-full h-96 p-4"
                    readOnly
                    value={JSON.stringify(results, null, 2)}
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={runTests} 
              disabled={isLoading || !webhookUrl.trim()}
              className={cartoonStyle.buttonPrimary}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Testing...
                </>
              ) : (
                'Test API Connection'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Troubleshooting Guide */}
      <div className="max-w-4xl mx-auto">
        <Card className={`${cartoonStyle.card} bg-white`}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black">Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-black mb-2">1. Verify your API key</h3>
                <p className="text-gray-700">
                  Make sure your API key from tracking.my is correct. The &quot;Invalid Api Token&quot; error means the API key is not recognized.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-black mb-2">2. Check API version</h3>
                <p className="text-gray-700">
                  The test results will show if the v1 or v2 API endpoints work better with your key.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-black mb-2">3. Check API header format</h3>
                <p className="text-gray-700">
                  Different APIs may require different authorization header formats. The test will check:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mt-2">
                  <li>Tracking-Api-Key: [your-key]</li>
                  <li>Authorization: Bearer [your-key]</li>
                  <li>x-api-key: [your-key]</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-black mb-2">4. Next steps</h3>
                <p className="text-gray-700">
                  If none of the API endpoints work, you may need to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mt-2">
                  <li>Contact tracking.my support to verify your API key</li>
                  <li>Generate a new API key in your tracking.my dashboard</li>
                  <li>Ensure your tracking.my account has API access enabled</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 