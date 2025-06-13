'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';

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

// Loading component for Suspense
function LoginPageLoading() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className={`${cartoonStyle.card} bg-white/90 backdrop-blur-sm p-6 md:p-8`}>
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-black animate-spin mb-4"></div>
            <p className="text-black font-bold">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Login content component that uses useSearchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Check for error in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('Invalid email or password. Please try again.');
          break;
        default:
          setError('An error occurred during authentication. Please try again.');
      }
    }
  }, [searchParams]);

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
      
      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
      };
    }
  }, [showAnimation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    try {
      setLoading(true);
      
      console.log('Attempting to sign in with:', { email });
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl
      });
      
      console.log('Sign in result:', JSON.stringify(result, null, 2));
      
      if (!result) {
        console.error('Authentication returned no result');
        throw new Error("No result from authentication provider");
      }
      
      if (result.error) {
        console.error('Authentication error details:', result.error);
        
        // Handle specific error types
        if (result.error === "No user found with this email") {
          throw new Error("No account found with this email address");
        } else if (result.error === "Invalid password") {
          throw new Error("Incorrect password. Please try again");
        } else {
          throw new Error(result.error);
        }
      }
      
      if (!result.ok) {
        console.error('Authentication not ok:', result);
        throw new Error("Authentication failed");
      }
      
      console.log('Authentication successful, redirecting to:', result?.url || callbackUrl);
      
      // Login successful - start animation
      setShowAnimation(true);
      
      // Get user role to determine the redirect path
      let redirectPath = '/main'; // Default path for buyers
      
      try {
        // We need to fetch the session to get user role since signIn result doesn't include it
        const userResponse = await fetch('/api/user/me');
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Redirect based on role
          if (userData.role === 'seller') {
            console.log('User is a seller, redirecting to seller dashboard');
            redirectPath = '/seller';
          } else if (userData.role === 'admin') {
            console.log('User is an admin, redirecting to admin dashboard');
            redirectPath = '/admin';
          } else {
            console.log('User is a buyer, redirecting to main page');
          }
        } else {
          console.warn('Could not fetch user data for role-based redirection, using default path');
        }
      } catch (fetchError) {
        console.error('Error fetching user data for redirection:', fetchError);
        // Continue with default redirection if there's an error
      }
      
      // After animation, redirect to the appropriate page based on role
      setTimeout(() => {
        console.log('Redirecting to:', redirectPath);
        router.push(redirectPath);
      }, 4500);
      
    } catch (err) {
      console.error('Authentication error type:', typeof err);
      console.error('Authentication error details:', JSON.stringify(err, null, 2));
      console.error('Authentication error message:', err instanceof Error ? err.message : 'Unknown error');
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
      {/* Back button */}
      <Link 
        href="/" 
        className={`${cartoonStyle.button} absolute top-4 left-4 p-2 z-20 flex items-center gap-2`}
      >
        <ArrowLeft size={18} className="text-black" />
        <span className="hidden sm:inline font-bold text-black">Back</span>
      </Link>
      
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
            
            <p className="text-lg md:text-xl text-center font-bold">Built for students. Trusted by thousands.</p>
          </div>
        </div>

        {/* Right side with login form */}
        <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8">
          <div className="w-full max-w-md">
            <div className={`${cartoonStyle.card} bg-white/90 backdrop-blur-sm p-6 md:p-8`}>
              <h2 className={`${cartoonStyle.heading} text-black mb-6`}>Log In</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border-3 border-black rounded-lg text-red-700 font-medium">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="Email"
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="mb-6">
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
                
                <button
                  type="submit"
                  className={`${cartoonStyle.buttonPrimary} w-full py-2 flex justify-center items-center`}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : 'Log In'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <p className="text-black">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-blue-600 hover:underline font-semibold">
                    Sign Up
                  </Link>
                </p>
              </div>
              
              <div className="mt-4 text-center">
                <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginContent />
    </Suspense>
  );
}
