'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Use dynamic import with no SSR for the Threads component since it uses browser APIs
const Threads = dynamic(() => import('@/components/Threads'), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Animation sequence effect
  useEffect(() => {
    if (showAnimation) {
      // Play sound effect when animation starts
      if (audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(err => console.error("Audio play failed:", err));
      }

      // Animation sequence timing
      const step1 = setTimeout(() => setAnimationStep(1), 500); // Show welcome text
      const step2 = setTimeout(() => setAnimationStep(2), 2500); // Show logo
      const step3 = setTimeout(() => {
        // Redirect after animation completes
        router.push('/main');
      }, 4500);

      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
        clearTimeout(step3);
      };
    }
  }, [showAnimation, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Login successful - start animation
      console.log('Login successful:', data.user);
      setShowAnimation(true);
      
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  // If animation is active, show the animation screen
  if (showAnimation) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        {/* Audio element for sound effect */}
        <audio ref={audioRef} src="/sounds/welcome.mp3" />
        
        {/* Welcome text - appears in step 1 */}
        <div className={`transition-opacity duration-1000 ${animationStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-white text-4xl md:text-6xl font-bold mb-8 text-center">
            WELCOME TO UITM MART
          </h1>
        </div>
        
        {/* Logo - appears in step 2 */}
        <div className={`transition-all duration-1000 transform ${animationStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <Image 
            src="/images/logo2.png"
            alt="UiTMMart Logo" 
            width={300} 
            height={300}
            priority
          />
        </div>
      </div>
    );
  }

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
            
            <p className="text-lg md:text-xl text-center">Built for students. Trusted by thousands.</p>
          </div>
        </div>

        {/* Right side with login form */}
        <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8">
          <div className="w-full max-w-md">
            <div className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 text-black">Log In</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Username / Email"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 text-black"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 text-black"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-700 text-white py-2 rounded uppercase font-medium hover:bg-blue-800 transition-colors disabled:bg-blue-400"
                  disabled={loading}
                >
                  {loading ? 'LOGGING IN...' : 'LOG IN'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot Password
                </Link>
              </div>
              
              <div className="my-6 flex items-center justify-between">
                <hr className="w-5/12 border-gray-300" />
                <span className="text-sm text-gray-500 px-2">OR</span>
                <hr className="w-5/12 border-gray-300" />
              </div>
              
              <button 
                className="w-full border border-gray-300 py-2 px-4 rounded flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={loading}
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
                <span>Google</span>
              </button>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">New to UitmMart?</span>{' '}
                <Link href="/register" className="text-blue-600 font-medium hover:underline">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
