'use client'


import { XCircle, ArrowLeft, ShoppingCart, Home, Search, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from "@/components/ui/tubelight-navbar";

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]",
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
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

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
      <NavBar items={navItems} />
      <div className="pt-32 px-4 mx-auto max-w-4xl">
        <div className={`${cartoonStyle.card} mb-6`}>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-red-100 rounded-full p-4 border-3 border-black mb-6">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            
            <h1 className="text-3xl font-bold text-black mb-2">Payment Cancelled</h1>
            <p className="text-gray-600 mb-8 text-center">
              Your payment was cancelled. No charges were made to your account.
            </p>
            
            <div className="bg-gray-50 border-3 border-black rounded-lg p-6 w-full max-w-md mb-8">
              <h2 className="text-lg font-bold text-black mb-4">What happened?</h2>
              
              <div className="space-y-4 text-gray-600">
                <p>Your payment process was cancelled. This could be because:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>You chose to cancel the payment</li>
                  <li>There was an issue with your payment method</li>
                  <li>The checkout session timed out</li>
                </ul>
                <p>Your items are still in your cart, and you can try again whenever you&apos;re ready.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
              <Link href="/cart" className={`${cartoonStyle.buttonPrimary} py-3 px-6 flex-1 flex items-center justify-center gap-2`}>
                <ShoppingCart className="h-5 w-5" />
                <span>Return to Cart</span>
              </Link>
              
              <Link href="/main" className={`${cartoonStyle.button} py-3 px-6 flex-1 flex items-center justify-center gap-2`}>
                <ArrowLeft className="h-5 w-5" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 