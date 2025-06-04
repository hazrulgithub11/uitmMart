'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Use dynamic import with no SSR for the Threads component since it uses browser APIs
const Threads = dynamic(() => import('@/components/Threads'), { ssr: false });

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

export default function SellerRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      
      // For now, we'll use the same API but later we'll modify it to handle the role
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          username,
          password,
          role: 'seller', // We'll add this field to the schema later
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Registration successful - redirect to login page
      alert('Seller registration successful! Please log in.');
      router.push('/login');
      
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-black flex items-center justify-center p-4">
      {/* Threads background animation covering the entire page */}
      <div className="absolute inset-0 z-0">
        <Threads
          amplitude={2.0}
          distance={0.3}
          enableMouseInteraction={true}
          color={[0.1, 0.2, 0.5]} // Darker blue color
        />
      </div>
      
      {/* Content positioned on top of the animation */}
      <div className="flex flex-col md:flex-row w-full max-w-6xl z-10 relative gap-8 md:gap-0">
        {/* Left side with logo and tagline */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-white p-4 md:p-8">
          <div className="flex flex-col items-center max-w-md">
            <div className="w-48 md:w-64 mb-4 relative">
              <Image 
                src="/images/logo3.png"
                alt="UiTMMart Logo" 
                width={200} 
                height={200}
                priority
              />
            </div>
            
            <p className="text-lg md:text-xl text-center font-bold">Become a seller and start your business with UiTMMart.</p>
          </div>
        </div>

        {/* Right side with registration form */}
        <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8">
          <div className="w-full max-w-md">
            <div className={`${cartoonStyle.card} bg-white/90 backdrop-blur-sm p-6 md:p-8`}>
              <h2 className={`${cartoonStyle.heading} text-black mb-6`}>Become a Seller</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border-3 border-black rounded-lg text-red-700 font-medium">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="Email Address"
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Username"
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    type="password"
                    placeholder="Password"
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="mb-6">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <button
                  type="submit"
                  className={`${cartoonStyle.buttonPrimary} w-full py-2 text-white uppercase font-bold disabled:opacity-50`}
                  disabled={loading}
                >
                  {loading ? 'REGISTERING...' : 'REGISTER AS SELLER'}
                </button>
              </form>
              
              <div className="my-6 flex items-center justify-between">
                <hr className="w-5/12 border-gray-300 border-2" />
                <span className="text-sm text-gray-700 font-bold px-2">OR</span>
                <hr className="w-5/12 border-gray-300 border-2" />
              </div>
              
              <button 
                className={`${cartoonStyle.button} w-full py-2 px-4 flex justify-center items-center gap-2 disabled:opacity-50`}
                disabled={loading}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                <span className="font-bold">Sign up with Google</span>
              </button>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600 font-medium">Want to register as a buyer instead?</span>{' '}
                <Link href="/register" className="text-blue-600 font-bold hover:underline">
                  Register as Buyer
                </Link>
              </div>
              
              <div className="mt-3 text-center text-sm">
                <span className="text-gray-600 font-medium">Already have an account?</span>{' '}
                <Link href="/login" className="text-blue-600 font-bold hover:underline">
                  Log In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 