'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users, Star } from 'lucide-react';

// Types for the analytics data
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

// Cartoon style for consistency
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]",
  cardHeader: "pb-2",
  cardTitle: "text-xl font-bold text-black flex items-center gap-2"
};

// Types for Recharts tooltip
interface TooltipPayload {
  color: string;
  dataKey: string;
  value: number | string;
  payload: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// Custom tooltip component
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-bold text-black">{`${label}`}</p>
        {payload.map((entry: TooltipPayload, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-medium">
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Format product name for display (truncate if too long)
const formatProductName = (name: string, maxLength: number = 15) => {
  return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
};

// Top Selling Products Chart
export const TopSellingChart: React.FC<{ data: TopSellingProduct[] }> = ({ data }) => {
  const chartData = data.map(item => ({
    name: formatProductName(item.name),
    fullName: item.name,
    units: item.totalUnits,
    shop: item.shopName,
    category: item.category
  }));

  return (
    <Card className={cartoonStyle.card}>
      <CardHeader className={cartoonStyle.cardHeader}>
        <CardTitle className={cartoonStyle.cardTitle}>
          <TrendingUp className="h-6 w-6 text-blue-500" />
          Top Selling Products (Units)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="units" 
              fill="#3b82f6" 
              stroke="#000000" 
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Top Revenue Products Chart
export const TopRevenueChart: React.FC<{ data: TopRevenueProduct[] }> = ({ data }) => {
  const chartData = data.map(item => ({
    name: formatProductName(item.name),
    fullName: item.name,
    revenue: Number(item.totalRevenue.toFixed(2)),
    units: item.totalUnits,
    shop: item.shopName
  }));

  return (
    <Card className={cartoonStyle.card}>
      <CardHeader className={cartoonStyle.cardHeader}>
        <CardTitle className={cartoonStyle.cardTitle}>
          <DollarSign className="h-6 w-6 text-green-500" />
          Top Revenue Products (RM)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="#10b981" 
              stroke="#000000" 
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Repeat Buyers Chart
export const RepeatBuyersChart: React.FC<{ data: RepeatBuyerData[] }> = ({ data }) => {
  const chartData = data.map(item => ({
    name: formatProductName(item.name),
    fullName: item.name,
    repeatBuyers: item.repeatBuyers,
    totalBuyers: item.totalBuyers,
    repeatRate: item.repeatRate,
    shop: item.shopName
  }));

  return (
    <Card className={cartoonStyle.card}>
      <CardHeader className={cartoonStyle.cardHeader}>
        <CardTitle className={cartoonStyle.cardTitle}>
          <Users className="h-6 w-6 text-purple-500" />
          Repeat Buyers Count
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="repeatBuyers" 
              fill="#8b5cf6" 
              stroke="#000000" 
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Rating vs Sales Chart (Grouped Bars)
export const RatingVsSalesChart: React.FC<{ data: RatingVsSalesData[] }> = ({ data }) => {
  const chartData = data.map(item => ({
    name: formatProductName(item.name),
    fullName: item.name,
    units: item.totalUnits,
    rating: item.averageRating,
    ratingCount: item.ratingCount,
    shop: item.shopName
  }));

  return (
    <Card className={cartoonStyle.card}>
      <CardHeader className={cartoonStyle.cardHeader}>
        <CardTitle className={cartoonStyle.cardTitle}>
          <Star className="h-6 w-6 text-orange-500" />
          Rating vs Sales Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="units" 
              fill="#f59e0b" 
              stroke="#000000" 
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
              name="Units Sold"
            />
            <Bar 
              yAxisId="right"
              dataKey="rating" 
              fill="#ef4444" 
              stroke="#000000" 
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
              name="Avg Rating"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Main Analytics Dashboard Component
export const ProductAnalyticsDashboard: React.FC<{ data: AnalyticsData; timeframe: string }> = ({ data, timeframe }) => {
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-blue-50 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalProductsSold}</div>
            <div className="text-sm text-gray-600">Total Units Sold</div>
            <div className="text-xs text-gray-500">Last {timeframe}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">RM{data.summary.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-xs text-gray-500">Last {timeframe}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{data.summary.totalProductsWithSales}</div>
            <div className="text-sm text-gray-600">Products Sold</div>
            <div className="text-xs text-gray-500">Last {timeframe}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">RM{data.summary.averageOrderValue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Avg Order Value</div>
            <div className="text-xs text-gray-500">Last {timeframe}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopSellingChart data={data.topSellingByUnits} />
        <TopRevenueChart data={data.topRevenueProducts} />
        <RepeatBuyersChart data={data.repeatBuyerData} />
        <RatingVsSalesChart data={data.ratingVsSalesData} />
      </div>
    </div>
  );
}; 