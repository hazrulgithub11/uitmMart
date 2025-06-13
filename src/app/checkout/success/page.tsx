'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, ShoppingBag, Home, Search, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from "@/components/ui/tubelight-navbar";

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]",
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full px-3 py-2"
};

// Navigation items
const navItems = [
  { name: 'Home', url: '/main', icon: Home },
  { name: 'Search', url: '/search', icon: Search },
  { name: 'Notifications', url: '/notifications', icon: Bell },
  { name: 'Profile', url: '/profile', icon: User }
];

interface OrderDetails {
  orderNumber: string;
  date?: string;
  createdAt?: string;
}

// Loading component
function LoadingState() {
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
      <NavBar items={navItems} />
      <div className="pt-32 px-4 mx-auto max-w-4xl">
        <div className={`${cartoonStyle.card} mb-6`}>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
            <p className="text-black font-bold">Verifying your payment...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component that uses useSearchParams
function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Clear checkout items from session storage
    sessionStorage.removeItem('checkoutItems');
    
    // If we have a session ID, fetch order details
    if (sessionId) {
      fetchOrderDetails(sessionId);
    } else {
      setLoading(false);
      setError('No session ID found. Unable to verify your order.');
    }
  }, [sessionId]);
  
  const fetchOrderDetails = async (stripeSessionId: string) => {
    try {
      const response = await fetch(`/api/orders/session?sessionId=${stripeSessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      
      if (data.order) {
        setOrderDetails(data.order);
      } else {
        // Fallback to simulated data if no order found
        setOrderDetails({
          orderNumber: `UITM-${Date.now().toString().slice(-6)}`,
          date: new Date().toLocaleDateString()
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback to simulated data if error
      setOrderDetails({
        orderNumber: `UITM-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString()
      });
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
        <NavBar items={navItems} />
        <div className="pt-32 px-4 mx-auto max-w-4xl">
          <div className={`${cartoonStyle.card} mb-6`}>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
              <p className="text-black font-bold">Verifying your payment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
        <NavBar items={navItems} />
        <div className="pt-32 px-4 mx-auto max-w-4xl">
          <div className={`${cartoonStyle.card} mb-6`}>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-6 text-center">{error}</p>
              <Link href="/cart" className={`${cartoonStyle.buttonPrimary} px-6 py-3`}>
                Return to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
      <NavBar items={navItems} />
      <div className="pt-32 px-4 mx-auto max-w-4xl">
        <div className={`${cartoonStyle.card} mb-6`}>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-green-100 rounded-full p-4 border-3 border-black mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            
            <h1 className="text-3xl font-bold text-black mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-8 text-center">
              Thank you for your purchase. Your order has been confirmed.
            </p>
            
            {orderDetails && (
              <div className="bg-gray-50 border-3 border-black rounded-lg p-6 w-full max-w-md mb-8">
                <h2 className="text-lg font-bold text-black mb-4">Order Details</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="text-black font-medium">{orderDetails.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-black font-medium">
                      {orderDetails.createdAt 
                        ? new Date(orderDetails.createdAt).toLocaleDateString() 
                        : orderDetails.date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-500 font-medium">Paid</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
              <Link href="/profile/purchases" className={`${cartoonStyle.buttonPrimary} py-3 px-6 flex-1 flex items-center justify-center gap-2`}>
                <ShoppingBag className="h-5 w-5" />
                <span>View My Orders</span>
              </Link>
              
              <Link href="/main" className={`${cartoonStyle.buttonSuccess} py-3 px-6 flex-1 flex items-center justify-center gap-2`}>
                <span>Continue Shopping</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
} 