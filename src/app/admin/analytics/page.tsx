'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Calendar, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductAnalyticsDashboard } from '@/components/ProductAnalyticsCharts';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide"
};

// Define proper types for analytics data
interface TopSellingProduct {
  id: number;
  name: string;
  shopName: string;
  category: string;
  totalUnits: number;
  price: number;
}

interface TopRevenueProduct {
  id: number;
  name: string;
  shopName: string;
  category: string;
  totalRevenue: number;
  totalUnits: number;
  price: number;
}

interface RepeatBuyerData {
  id: number;
  name: string;
  shopName: string;
  category: string;
  totalBuyers: number;
  repeatBuyers: number;
  repeatRate: number;
}

interface RatingVsSalesData {
  id: number;
  name: string;
  shopName: string;
  category: string;
  totalUnits: number;
  averageRating: number;
  ratingCount: number;
  price: number;
}

interface AnalyticsData {
  topSellingByUnits: TopSellingProduct[];
  topRevenueProducts: TopRevenueProduct[];
  repeatBuyerData: RepeatBuyerData[];
  ratingVsSalesData: RatingVsSalesData[];
  summary: {
    timeframe: string;
    totalProductsSold: number;
    totalRevenue: number;
    totalProductsWithSales: number;
    averageOrderValue: number;
  };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30');

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/analytics');
    }
  }, [status, session, router]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/analytics/product-performance?timeframe=${timeframe}&limit=10`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [status, session, fetchAnalytics]);

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  // If loading or unauthorized, show appropriate UI
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="font-bold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don&apos;t have permission to access this analytics page.</p>
          <Button 
            onClick={() => router.push('/')} 
            className={cartoonStyle.buttonPrimary}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/admin')} 
              className={`${cartoonStyle.button} text-black`}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className={`${cartoonStyle.heading} text-black`}>Product Performance Analytics</h1>
              <p className="text-gray-700 mt-1 font-medium">Comprehensive insights into your marketplace performance</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card className={cartoonStyle.card}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-black flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Analytics Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-black">
              <div className="flex items-center gap-2">
                <label className="font-medium text-black">Timeframe:</label>
                <Select value={timeframe} onValueChange={handleTimeframeChange}>
                  <SelectTrigger className="w-40 border-2 border-black">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={fetchAnalytics} 
                className={cartoonStyle.buttonPrimary}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {loading && (
          <div className="text-center py-12">
            <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] inline-block">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="font-bold text-lg text-black">Loading Analytics Data...</p>
              <p className="text-gray-600 mt-2">This may take a few moments</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <Card className="bg-red-50 border-4 border-red-500 rounded-xl shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />
                <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Analytics</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Button 
                  onClick={fetchAnalytics} 
                  className={cartoonStyle.buttonPrimary}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {analyticsData && !loading && !error && (
          <ProductAnalyticsDashboard data={analyticsData} timeframe={timeframe === '7' ? '7 days' : timeframe === '30' ? '30 days' : timeframe === '60' ? '60 days' : timeframe === '90' ? '90 days' : timeframe === '180' ? '6 months' : '1 year'} />
        )}

        {analyticsData && !loading && !error && (
          <div className="mt-8 text-center text-black">
            <Button 
              className={cartoonStyle.button}
              onClick={() => router.push('/admin')}
            >
              Return to Admin Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 