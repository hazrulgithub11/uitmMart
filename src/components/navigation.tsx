"use client";

import { Home, ShoppingCart, User, Heart, Bell, HelpCircle, Settings } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import Link from "next/link";
import Image from "next/image";

export function Navigation() {
  const tabs = [
    { title: "Home", icon: Home },
    { title: "Shop", icon: ShoppingCart },
    { type: "separator" as const },
    { title: "Account", icon: User },
    { title: "Wishlist", icon: Heart },
    { title: "Notifications", icon: Bell },
    { type: "separator" as const },
    { title: "Help", icon: HelpCircle },
    { title: "Settings", icon: Settings },
  ];

  const handleNavChange = (index: number | null) => {
    // Handle navigation changes here
    if (index === null) return;
    
    // Example navigation logic
    console.log(`Selected tab: ${index}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image
              src="/images/logo2.png"
              alt="UiTMMart Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-white font-bold text-xl hidden sm:block">UiTMMart</span>
        </Link>

        <div className="flex-1 max-w-xl mx-auto px-4 hidden md:block">
          <ExpandableTabs 
            tabs={tabs} 
            activeColor="text-blue-400"
            className="border-gray-800 bg-black/50" 
            onChange={handleNavChange}
          />
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </header>
  );
} 