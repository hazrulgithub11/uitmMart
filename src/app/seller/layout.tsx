'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Package, ShoppingBag, Settings, User, LogOut, Store, CreditCard } from 'lucide-react';

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

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shopData, setShopData] = useState<ShopData>({ name: 'My Shop', logoUrl: null });
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  useEffect(() => {
    // Check if user is authenticated and is a seller
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'seller') {
        router.push('/main');
      } else {
        setLoading(false);
        // Fetch shop data
        fetchShopData();
      }
    }
  }, [status, session, router, fetchShopData]);

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
    { href: '/seller/shop-settings', label: 'Shop Settings', icon: Settings },
    { href: '/seller/account-settings', label: 'Account', icon: User },
    { href: '/seller/payment', label: 'Payment', icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
      {/* Sidebar navigation */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r-4 border-black p-4 shadow-[8px_0px_0px_0px_rgba(0,0,0,0.8)]">
        <div className="mb-6">
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
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-lg px-4 py-3 mb-2 transition-all hover:translate-x-1 text-black font-bold bg-white border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          ))}

          <hr className="my-4 border-2 border-black" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-4 py-3 transition-all hover:translate-x-1 font-bold bg-red-500 text-white border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="ml-64 flex-1 p-6">
        {children}
      </div>

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
