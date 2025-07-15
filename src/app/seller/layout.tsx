'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Package, ShoppingBag, Settings, User, LogOut, Store, CreditCard, MessageSquare, PercentSquare, IdCard, Lock } from 'lucide-react';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

interface ShopData {
  name: string;
  logoUrl: string | null;
}

// Interface for conversation objects
interface Conversation {
  id: number;
  unreadCount?: number;
  lastMessageAt: string;
  messages: Array<{
    id: number;
    content: string;
    createdAt: string;
    read: boolean;
    senderId: number;
  }>;
}

// Interface for KYC verification status
interface VerificationStatus {
  id?: number;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [shopData, setShopData] = useState<ShopData>({ name: 'My Shop', logoUrl: null });
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [kycStatus, setKycStatus] = useState<VerificationStatus | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);

  const fetchShopData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.log("Fetching shop data for user:", session.user.id);
      const response = await fetch(`/api/shop?userId=${session.user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.shop) {
          setShopData({
            name: data.shop.name || 'My Shop',
            logoUrl: data.shop.logoUrl
          });
          console.log("Loaded shop data:", data.shop);
        }
      } else if (response.status !== 404) {
        // 404 is expected for new sellers without shops
        console.error('Error fetching shop data:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  }, [session?.user?.id]);

  // Fetch unread message count
  const fetchUnreadMessages = useCallback(async () => {
    if (!session?.user?.id) return;
    
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
  }, [session?.user?.id]);

  // Fetch KYC verification status
  const fetchKycStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.log("Fetching KYC verification status for user:", session.user.id);
      const response = await fetch('/api/student-verification');
      
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data.verification);
        console.log("Loaded KYC status:", data.verification);
      } else if (response.status === 404 || !response.ok) {
        // No verification submitted yet
        setKycStatus(null);
        console.log("No KYC verification found");
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setKycStatus(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    // Check if user is authenticated and is a seller
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'seller') {
        router.push('/main');
      } else {
        setLoading(false);
        // Fetch shop data, unread messages, and KYC status
        fetchShopData();
        fetchUnreadMessages();
        fetchKycStatus();
        
        // Set up interval to periodically check for new messages and KYC status
        const intervalId = setInterval(() => {
          fetchUnreadMessages();
          fetchKycStatus();
        }, 60000); // Check every minute
        
        return () => clearInterval(intervalId);
      }
    }
  }, [status, session, router, fetchShopData, fetchUnreadMessages, fetchKycStatus]);

  // Check if KYC is completed (approved)
  const isKycCompleted = kycStatus?.verificationStatus === 'approved';

  // Check if current page is Student ID page
  const isStudentIdPage = pathname === '/seller/studentID';

  // Handle navigation clicks for locked pages
  const handleNavigationClick = (e: React.MouseEvent, href: string) => {
    if (!isKycCompleted && href !== '/seller/studentID') {
      e.preventDefault();
      setShowKycModal(true);
    }
  };

  // Handler for logout confirmation
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  // Handler for confirming logout
  const confirmLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Handler for canceling logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[url('/images/backuitm.png')] bg-cover bg-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 font-bold text-black">Loading seller dashboard...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/seller', label: 'Home', icon: Home },
    { href: '/seller/products', label: 'Products', icon: Package },
    { href: '/seller/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/seller/discount', label: 'Discounts', icon: PercentSquare },
    { href: '/seller/chat', label: 'Messages', icon: MessageSquare },
    { href: '/seller/shop-settings', label: 'Shop Settings', icon: Settings },
    { href: '/seller/account-settings', label: 'Account', icon: User },
    { href: '/seller/payment', label: 'Payment', icon: CreditCard },
    { href: '/seller/studentID', label: 'Student ID', icon: IdCard },
  ];

  return (
    <div className="flex min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
      {/* Sidebar navigation */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r-4 border-black p-4 shadow-[8px_0px_0px_0px_rgba(0,0,0,0.8)] flex flex-col">
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-center py-4">
            {shopData.logoUrl ? (
              // Display the seller's uploaded logo if available
              <div className="rounded-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-[70px] w-[70px]">
                <Image
                  src={shopData.logoUrl}
                  alt={shopData.name}
                  width={70}
                  height={70}
                  className="object-cover h-[70px] w-[70px]"
                />
              </div>
            ) : (
              // Display a default placeholder if no logo is uploaded
              <div className="rounded-full border-3 border-black h-[70px] w-[70px] flex items-center justify-center bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Store className="h-8 w-8 text-gray-700" />
              </div>
            )}
          </div>
          <h2 className="px-4 text-lg font-extrabold text-center text-black mt-2">{shopData.name}</h2>
          <p className="px-4 text-sm font-medium text-center text-gray-700">Seller Dashboard</p>
          
          {/* KYC Status Indicator */}
          {!isKycCompleted && (
            <div className="mt-3 px-4">
              <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Lock className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-xs font-bold text-orange-800">KYC Required</span>
                </div>
                <p className="text-xs text-orange-700">
                  {!kycStatus ? 
                    "Complete Student ID verification" :
                    kycStatus.verificationStatus === 'pending' ? "Verification pending" :
                    kycStatus.verificationStatus === 'under_review' ? "Under review" :
                    kycStatus.verificationStatus === 'rejected' ? "Verification rejected" :
                    "Complete verification first"
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto pr-2" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}>
          <div className="space-y-1 pb-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const showBadge = item.label === 'Messages' && unreadMessages > 0;
              const isLocked = !isKycCompleted && item.href !== '/seller/studentID';
              
              return (
                <div key={item.href} className="relative">
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavigationClick(e, item.href)}
                    className={`flex items-center rounded-lg px-4 py-3 mb-2 transition-all text-black font-bold border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] ${
                      isLocked 
                        ? 'bg-gray-200 cursor-not-allowed opacity-60' 
                        : 'bg-white hover:translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    } ${isActive ? 'bg-blue-100' : ''}`}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <div className="rounded-full bg-red-500 text-white text-xs font-bold h-5 w-5 flex items-center justify-center border-2 border-black flex-shrink-0">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </div>
                    )}
                    {isLocked && (
                      <Lock className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed logout section at bottom */}
        <div className="flex-shrink-0 border-t-4 border-black pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-4 py-3 transition-all hover:translate-x-1 font-bold bg-red-500 text-white border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content area with blur overlay for locked pages */}
      <div className="ml-64 flex-1 relative">
        {!isKycCompleted && !isStudentIdPage ? (
          // Render blurred content with overlay
          <div className="relative">
            <div className="filter blur-sm pointer-events-none p-6">
              {children}
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className={`${cartoonStyle.card} bg-white w-96 max-w-md text-center`}>
                <div className="flex flex-col items-center">
                  <div className="bg-orange-100 rounded-full p-4 mb-4">
                    <Lock className="h-12 w-12 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-black mb-2">Complete KYC Verification</h3>
                  <p className="text-gray-700 font-medium mb-6">
                    You need to complete your Student ID verification before accessing this page.
                  </p>
                  <div className="space-y-3 w-full">
                    <Link
                      href="/seller/studentID"
                      className={`${cartoonStyle.buttonPrimary} w-full text-center px-6 py-3 font-bold`}
                    >
                      Complete Verification
                    </Link>
                    {kycStatus && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">
                          Status: <span className="capitalize text-orange-600 font-bold">{kycStatus.verificationStatus}</span>
                        </p>
                        {kycStatus.verificationStatus === 'rejected' && kycStatus.rejectionReason && (
                          <p className="text-red-600 mt-1 text-xs">{kycStatus.rejectionReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Render normal content
          <div className="p-6">
            {children}
          </div>
        )}
      </div>

      {/* KYC Modal for navigation clicks */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${cartoonStyle.card} bg-white w-80 max-w-md`}>
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-100 rounded-full p-3 mb-4">
                <Lock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="mb-4 text-lg font-extrabold text-black">Verification Required</h3>
              <p className="mb-6 text-gray-700 font-medium">
                Please complete your Student ID verification to access this feature.
              </p>
              <div className="flex justify-end space-x-3 w-full">
                <button
                  onClick={() => setShowKycModal(false)}
                  className={cartoonStyle.button + " text-black px-4 py-2"}
                >
                  Cancel
                </button>
                <Link
                  href="/seller/studentID"
                  onClick={() => setShowKycModal(false)}
                  className={cartoonStyle.buttonPrimary + " px-4 py-2 text-center"}
                >
                  Verify Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${cartoonStyle.card} bg-white w-80 max-w-md`}>
            <h3 className="mb-4 text-lg font-extrabold text-black">Confirm Logout</h3>
            <p className="mb-6 text-gray-700 font-medium">Are you sure you want to log out? You&apos;ll need to sign in again to access your seller dashboard.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className={cartoonStyle.button + " text-black"}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
