"use client";

import { useState, useEffect } from "react";
import { Home, ShoppingCart, User, Heart, HelpCircle, Settings, MessageSquare } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

// Define interface for conversation object
interface Conversation {
  unreadCount?: number;
  id: number;
  buyerId: number;
  sellerId: number;
  shopId: number;
  lastMessageAt: string;
  messages?: Array<{
    id: number;
    content: string;
    createdAt: string;
    read: boolean;
    senderId: number;
  }>;
}

export function Navigation() {
  const { data: session, status } = useSession();
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Fetch unread message count if user is authenticated
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/chat/conversations');
          if (response.ok) {
            const conversations = await response.json();
            const totalUnread = conversations.reduce((total: number, conversation: Conversation) => {
              return total + (conversation.unreadCount || 0);
            }, 0);
            setUnreadMessages(totalUnread);
          }
        } catch (error) {
          console.error('Error fetching unread messages:', error);
        }
      }
    };
    
    fetchUnreadMessages();
    
    // Set up interval to periodically check for new messages
    const intervalId = setInterval(fetchUnreadMessages, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [status]);
  
  const tabs = [
    { title: "Home", icon: Home, href: "/main" },
    { title: "Shop", icon: ShoppingCart, href: "/shoplist" },
    { type: "separator" as const },
    { title: "Account", icon: User, href: "/profile" },
    { 
      title: "Messages", 
      icon: MessageSquare, 
      href: "/chat/conversations",
      badge: unreadMessages > 0 ? unreadMessages : undefined 
    },
    { title: "Wishlist", icon: Heart, href: "/wishlist" },
    { type: "separator" as const },
    { title: "Help", icon: HelpCircle, href: "/help" },
    { title: "Settings", icon: Settings, href: "/settings" },
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
          {status === 'authenticated' ? (
            <div className="flex items-center gap-3">
              {unreadMessages > 0 && (
                <Link href="/chat/conversations" className="relative">
                  <MessageSquare className="h-6 w-6 text-white" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                </Link>
              )}
              <Link 
                href="/profile" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                {session.user?.name || 'Profile'}
              </Link>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 