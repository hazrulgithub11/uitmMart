'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import type { SignInResponse } from 'next-auth/react';

export default function TestAuthPage() {
  const [email, setEmail] = useState('pau@gmail');
  const [password, setPassword] = useState('123123');
  const [result, setResult] = useState<SignInResponse | { error: string } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    status: string;
    session: {
      user?: {
        name?: string;
        email?: string;
        image?: string;
        id?: string | number;
        role?: string;
        phoneNumber?: string;
        gender?: string;
        dateOfBirth?: string;
        profileImage?: string;
        username?: string;
      };
      expires?: string;
    } | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get the current session
  const { data: session, status } = useSession();
  
  useEffect(() => {
    // Update session info when it changes
    setSessionInfo({
      status,
      session: session ? {
        ...session,
        expires: session.expires
      } : null
    });
  }, [session, status]);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing login with:', { email, password });
      
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      console.log('Raw result:', signInResult);
      setResult(signInResult || null);
    } catch (error) {
      console.error('Error during test:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">NextAuth Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded text-black">
        <h2 className="text-lg font-semibold mb-2">Current Session Status: {status}</h2>
        {sessionInfo && (
          <pre className="overflow-auto">{JSON.stringify(sessionInfo, null, 2)}</pre>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full text-black"
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Password:</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full text-black"
        />
      </div>
      
      <button 
        onClick={handleTest} 
        disabled={loading}
        className="bg-blue-500 text-white p-2 rounded"
      >
        {loading ? 'Testing...' : 'Test Login'}
      </button>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-black overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Auth Debugging Tips:</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Check if NEXTAUTH_SECRET is consistent across auth.ts and middleware.ts</li>
          <li>Verify database connection is working and user data exists</li>
          <li>Make sure API routes are configured correctly (especially [id] handling)</li>
          <li>Confirm bcrypt is working for password hashing/verification</li>
        </ul>
      </div>
    </div>
  );
} 