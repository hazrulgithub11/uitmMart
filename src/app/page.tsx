"use client";

import Image from "next/image";
import Link from "next/link";
import { DockDemo } from "@/components/ui/dock-demo";
import { LampDemo } from "@/components/ui/lamp-demo";
import { Button } from "@/components/ui/moving-border";
import { TimelineDemo } from "@/components/ui/timeline-demo";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Content */}
      <div className="relative z-10">
        {/* Logo, dock navigation, and login button row */}
        <div className="w-full flex justify-between items-center px-6 pt-6 pb-2 relative">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/images/logo3.png"
                alt="UiTMMart Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="text-white font-bold text-xl">UiTMMart</span>
          </div>
          
          {/* Centered dock navigation (desktop only) */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <DockDemo />
          </div>
          
          {/* Login button */}
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Log In
          </Link>
        </div>
        
        {/* Mobile dock navigation */}
        <div className="md:hidden w-full flex justify-center items-center mt-4 mb-0">
          <div className="w-full max-w-xl mx-auto">
            <DockDemo />
          </div>
        </div>
        
        {/* Lamp Demo Section with Welcome text */}
        <div className="w-full relative mt-0">
          <LampDemo />
          <div className="absolute w-full bottom-[15%] left-0 right-0 z-50 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-2 text-white">
              Welcome to UiTMMart
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              Built for students. Trusted by thousands.
            </p>
          </div>
        </div>
        
        <main className="container mx-auto px-4 pb-24 flex flex-col items-center justify-center text-center pt-8">
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              href="/shop"
              containerClassName="w-auto h-auto"
              borderClassName="bg-[radial-gradient(var(--blue-500)_40%,transparent_60%)]"
              className="rounded-full bg-blue-600 hover:bg-blue-700 border-blue-500/20 text-white px-8 py-3 text-lg font-medium transition-colors"
            >
              Start Shopping
            </Button>
            <Link
              href="/about"
              className="rounded-full border border-white/20 hover:bg-white/10 text-white px-8 py-3 text-lg font-medium transition-colors"
            >
              Learn More
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-16">
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/5">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCartIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Student Discounts</h3>
              <p className="text-gray-300">
                Get exclusive discounts on products and services.
              </p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/5">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
              <p className="text-gray-300">
                We deliver directly to your university address.
              </p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/5">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <SupportIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
              <p className="text-gray-300">
                Our team is always here to help you.
              </p>
            </div>
          </div>
          
          {/* Project Timeline Section */}
          <div className="w-full mt-32 mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Our Journey</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Follow the story of how UiTMMart came to be and our ongoing mission to serve the UiTM community.
              </p>
            </div>
            <TimelineDemo />
          </div>
        </main>
      </div>
    </div>
  );
}

// Simple icon components
function ShoppingCartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function TruckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L16 6h-4v11h3" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function SupportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.479m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z" />
    </svg>
  );
}
