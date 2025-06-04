'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Component that uses useSearchParams
function ErrorContent() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    const error = searchParams.get('error');
    
    // Map error codes to user-friendly messages
    switch (error) {
      case 'CredentialsSignin':
        setErrorMessage('Invalid email or password. Please try again.');
        break;
      case 'AccessDenied':
        setErrorMessage('Access denied. You do not have permission to access this resource.');
        break;
      case 'Configuration':
        setErrorMessage('There is a problem with the server configuration.');
        break;
      case 'Verification':
        setErrorMessage('The verification link may have expired or been used already.');
        break;
      default:
        setErrorMessage('An unknown error occurred. Please try again later.');
    }
  }, [searchParams]);

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Image
          src="/images/logo2.png"
          alt="UiTMMart Logo"
          width={80}
          height={80}
          className="mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
        <p className="text-zinc-400">{errorMessage}</p>
      </div>
      
      <div className="bg-zinc-900 rounded-lg p-6 shadow-lg">
        <div className="flex flex-col space-y-4">
          <Link 
            href="/login" 
            className="w-full bg-blue-600 text-white py-2 rounded text-center hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </Link>
          <Link 
            href="/" 
            className="w-full border border-zinc-700 text-white py-2 rounded text-center hover:bg-zinc-800 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function ErrorLoading() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 w-20 h-20 bg-zinc-800 animate-pulse rounded-full"></div>
        <div className="h-8 bg-zinc-800 animate-pulse rounded mb-2"></div>
        <div className="h-4 bg-zinc-800 animate-pulse rounded"></div>
      </div>
      
      <div className="bg-zinc-900 rounded-lg p-6 shadow-lg">
        <div className="flex flex-col space-y-4">
          <div className="w-full bg-zinc-800 animate-pulse h-10 rounded"></div>
          <div className="w-full bg-zinc-800 animate-pulse h-10 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <Suspense fallback={<ErrorLoading />}>
        <ErrorContent />
      </Suspense>
    </div>
  );
} 