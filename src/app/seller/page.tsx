'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ArrowUp, 
  ArrowDown, 
  Package, 
  ShoppingBag, 
  Users, 
  Plus 
} from 'lucide-react';

// Cartoon UI Style - copied from orders page
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Add appropriate interfaces for shop data and orders
interface Shop {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  slug: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    fullName: string;
    email: string;
  };
}

export default function SellerDashboard() {
  const { data: session } = useSession();
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [productCount, setProductCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch shop data and stats
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch shop data
        const shopResponse = await fetch('/api/shops');
        if (shopResponse.ok) {
          const shopData = await shopResponse.json();
          setShopData(shopData);
        }

        // Fetch dashboard statistics
        const dashboardResponse = await fetch('/api/seller/dashboard');
        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          setProductCount(dashboardData.productCount);
          setOrdersCount(dashboardData.ordersCount);
          setCustomerCount(dashboardData.customerCount);
          setTotalRevenue(dashboardData.totalRevenue);
          setRecentOrders(dashboardData.recentOrders);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate trends (this would be more accurate with historical data)
  const calculateTrend = (value: number) => {
    // For now we'll use a simple logic - if there are any orders/customers, show a positive trend
    if (value > 0) {
      return {
        change: 'New',
        trend: 'up'
      };
    }
    return {
      change: '0%',
      trend: 'neutral'
    };
  };

  // Stats cards data
  const stats = [
    {
      title: 'Products',
      value: productCount,
      icon: Package,
      color: 'bg-blue-500',
      change: calculateTrend(productCount).change,
      trend: calculateTrend(productCount).trend,
      link: '/seller/products'
    },
    {
      title: 'Orders',
      value: ordersCount,
      icon: ShoppingBag,
      color: 'bg-green-500',
      change: calculateTrend(ordersCount).change,
      trend: calculateTrend(ordersCount).trend,
      link: '/seller/orders'
    },
    {
      title: 'Customers',
      value: customerCount,
      icon: Users,
      color: 'bg-purple-500',
      change: calculateTrend(customerCount).change,
      trend: calculateTrend(customerCount).trend,
      link: '/seller/orders'
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-black font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-contain bg-repeat p-6 space-y-8">
      {/* Welcome header */}
      <div className={`${cartoonStyle.card} bg-white`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`${cartoonStyle.heading} text-black`}>
              Welcome back, {session?.user?.name || 'Seller'}
            </h1>
            <p className="mt-1 text-gray-700 font-medium">
              {shopData?.name ? `Managing ${shopData.name}` : 'Manage your shop and products'}
            </p>
          </div>
          {shopData ? (
            <Link 
              href="/seller/products/add" 
              className={`${cartoonStyle.buttonPrimary} inline-flex items-center px-4 py-2 text-sm font-bold`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Link>
          ) : (
            <Link 
              href="/seller/shop-settings" 
              className={`${cartoonStyle.buttonPrimary} inline-flex items-center px-4 py-2 text-sm font-bold`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Set Up Your Shop
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <Link
            href={stat.link}
            key={stat.title}
            className={`${cartoonStyle.card} bg-yellow-50 hover:bg-yellow-100`}
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-bold text-black">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-black">{stat.value}</p>
              </div>
              <div className={`rounded-full ${stat.color} p-3 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.trend === 'up' && (
                <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
              )}
              {stat.trend === 'down' && (
                <ArrowDown className="mr-1 h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-bold ${
                stat.trend === 'up' 
                  ? 'text-green-600' 
                  : stat.trend === 'down' 
                    ? 'text-red-600' 
                    : 'text-gray-700'
              }`}>
                {stat.change}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className={`${cartoonStyle.card} bg-white`}>
        <h2 className={`mb-4 text-xl font-bold text-black`}>Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/seller/products/add"
            className="flex items-center rounded-lg bg-blue-100 p-4 hover:bg-blue-200 transition-colors border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="rounded-full bg-blue-500 p-2 mr-3 border-2 border-black">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-black">Add New Product</span>
          </Link>
          <Link
            href="/seller/shop-settings"
            className="flex items-center rounded-lg bg-purple-100 p-4 hover:bg-purple-200 transition-colors border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="rounded-full bg-purple-500 p-2 mr-3 border-2 border-black">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-black">Update Shop Details</span>
          </Link>
          <Link
            href="/seller/orders"
            className="flex items-center rounded-lg bg-green-100 p-4 hover:bg-green-200 transition-colors border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="rounded-full bg-green-500 p-2 mr-3 border-2 border-black">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-black">View Orders</span>
          </Link>
        </div>
      </div>

      {/* Activity panel */}
      <div className={`${cartoonStyle.card} bg-white`}>
        <h2 className="mb-4 text-xl font-bold text-black">Recent Activity</h2>
        {recentOrders.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 p-4 border-2 border-black">
              <h3 className="font-bold text-black mb-2">Recent Orders</h3>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <div>
                      <p className="font-bold text-black">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-black">RM {Number(order.totalAmount).toFixed(2)}</p>
                      <Link 
                        href={`/seller/orders/${order.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <Link 
                  href="/seller/orders" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-bold"
                >
                  View all orders →
                </Link>
              </div>
            </div>
            {totalRevenue > 0 && (
              <div className="rounded-lg bg-green-50 p-4 border-2 border-black">
                <h3 className="font-bold text-black mb-2">Revenue</h3>
                <p className="text-2xl font-bold text-black">RM {Number(totalRevenue).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total revenue from paid orders</p>
              </div>
            )}
          </div>
        ) : productCount > 0 ? (
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">You have {productCount} products in your inventory.</p>
            <p className="text-gray-700 font-medium">No orders received yet.</p>
            <Link 
              href="/seller/products" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-bold"
            >
              View all products →
            </Link>
          </div>
        ) : (
          <div className="rounded-lg bg-yellow-50 p-6 text-center border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-black font-bold">No recent activity found.</p>
            <p className="mt-2 text-gray-700 font-medium">Start by adding products to your shop.</p>
            <Link
              href="/seller/products/add"
              className={`mt-4 inline-flex items-center px-4 py-2 text-sm font-bold ${cartoonStyle.buttonPrimary}`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
