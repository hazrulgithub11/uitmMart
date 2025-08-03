'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  Search, 
  ArrowLeft, 
  ArrowUpDown,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  Store,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Brain,
  X,
  BarChart3,
  Target,
  Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Product interface with shop information
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: string;
  images: string[];
  shopId: number;
  createdAt: string;
  updatedAt: string;
  discountPercentage?: number | null;
  discountedPrice?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  shop?: {
    id: number;
    name: string;
    seller: {
      fullName: string;
      email: string;
    };
  };
}

interface Shop {
  id: number;
  name: string;
  seller: {
    fullName: string;
    email: string;
  };
}

interface ProductStats {
  totalProducts: number;
  totalValue: number;
  activeProducts: number;
  outOfStock: number;
  categories: { [key: string]: number };
}

interface AIAnalysisResult {
  executiveSummary: string;
  studentBuyingBehavior: {
    topCategories: string[];
    popularPriceRange: string;
    seasonalTrends: string;
    buyingFrequency: string;
  };
  productInsights: {
    highDemandProducts: Array<{
      name: string;
      category: string;
      reason: string;
    }>;
    emergingCategories: string[];
    underperformingCategories: string[];
    priceOptimizationSuggestions: string;
  };
  vendorRecommendations: {
    eventVendors: Array<{
      category: string;
      recommendedVendors: string[];
      reason: string;
    }>;
    partnerships: Array<{
      vendor: string;
      specialty: string;
      eventTypes: string[];
    }>;
  };
  marketOpportunities: {
    gaps: string[];
    expansion: string[];
    innovations: string[];
  };
  actionableInsights: string[];
}

const categories = [
  'All',
  'Textbooks & Reference',
  'Stationery', 
  'Past Year Papers',
  'Electronics',
  'USB & Storage',
  'Clothing',
  'Shoes & Sneakers',
  'Accessories',
  'Self-Care & Grooming',
  'Snacks & Instant Food',
  'Homemade Food',
  'Beverages',
  'Furniture',
  'Bedding & Pillows',
  'Room Decorations',
  'Tutoring Services',
  'Resume/Templates',
  'Digital Art',
  'Board Games',
  'Tech Gadgets'
];

const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-800' },
    inactive: { label: 'Inactive', className: 'bg-red-100 text-red-800 border-red-800' },
    draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800 border-yellow-800' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
  
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-bold border-2 ${config.className}`}>
      {config.label}
    </span>
  );
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<{ [key: number]: Shop }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/products');
    }
  }, [status, session, router]);

  // Fetch all products and shops
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all products (admin can see all shops)
      const [productsResponse, shopsResponse] = await Promise.all([
        fetch('/api/products?allShops=true'),
        fetch('/api/shops?allShops=true')
      ]);
      
      if (!productsResponse.ok || !shopsResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const productsData = await productsResponse.json();
      const shopsData = await shopsResponse.json();
      
      // Create shops lookup
      const shopsLookup = shopsData.reduce((acc: { [key: number]: Shop }, shop: Shop) => {
        acc[shop.id] = shop;
        return acc;
      }, {});
      
      setProducts(productsData);
      setShops(shopsLookup);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchProducts();
    }
  }, [status, session]);

  // AI Analysis function
  const runAIAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const response = await fetch('/api/admin/products/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze products');
      }
      
      const data = await response.json();
      setAnalysisResult(data.analysis);
      setShowAnalysis(true);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate statistics
  const stats: ProductStats = React.useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (Number(product.price) * product.stock), 0);
    const activeProducts = products.filter(p => p.status === 'active').length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    
    const categories = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return { totalProducts, totalValue, activeProducts, outOfStock, categories };
  }, [products]);

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shops[product.shopId]?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    if (sortBy === 'shopName') {
      aValue = shops[a.shopId]?.name || '';
      bValue = shops[b.shopId]?.name || '';
    } else {
      aValue = a[sortBy as keyof Product] as string | number;
      bValue = b[sortBy as keyof Product] as string | number;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? (aValue as string).localeCompare(bValue as string) 
        : (bValue as string).localeCompare(aValue as string);
    } else {
      return sortDirection === 'asc' 
        ? Number(aValue) - Number(bValue) 
        : Number(bValue) - Number(aValue);
    }
  });

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="font-bold text-lg">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-4">Error Loading Products</h1>
          <p className="mb-6 text-gray-700">{error}</p>
          <Button 
            onClick={fetchProducts} 
            className={cartoonStyle.buttonPrimary}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              onClick={() => router.push('/admin')}
              className={`${cartoonStyle.button} mr-4 text-black`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className={`${cartoonStyle.heading} text-black`}>Product Management</h1>
              <p className="text-gray-700 mt-1 font-medium">Manage all products across all shops</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={runAIAnalysis}
              disabled={isAnalyzing}
              className={`${cartoonStyle.buttonPrimary} flex items-center`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                </>
              )}
            </Button>
            <Badge className="bg-purple-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">
              Admin
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className={cartoonStyle.card}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Total Products</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className={cartoonStyle.card}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">RM {stats.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className={cartoonStyle.card}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Active Products</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.activeProducts}</div>
            </CardContent>
          </Card>

          <Card className={cartoonStyle.card}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Out of Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.outOfStock}</div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Results */}
        {showAnalysis && analysisResult && (
          <Card className={`${cartoonStyle.card} mb-8`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="h-6 w-6 text-purple-500 mr-2" />
                  <CardTitle className="text-xl font-bold text-black">AI Product Analysis Report</CardTitle>
                </div>
                <Button
                  onClick={() => setShowAnalysis(false)}
                  className={`${cartoonStyle.button} p-2`}
                  title="Close Analysis"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <h3 className="font-bold text-black mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                  Executive Summary
                </h3>
                <p className="text-gray-700">{analysisResult.executiveSummary}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Buying Behavior */}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-black">
                  <h3 className="font-bold text-black mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-green-500" />
                    Student Buying Behavior
                  </h3>
                  <div className="space-y-2 text-black">
                    <div>
                      <span className="font-medium">Top Categories:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.studentBuyingBehavior.topCategories.map((category, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800 border-green-800 text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Popular Price Range:</span>
                      <span className="ml-2 text-gray-700">{analysisResult.studentBuyingBehavior.popularPriceRange}</span>
                    </div>
                    <div>
                      <span className="font-medium">Buying Frequency:</span>
                      <p className="text-gray-700 text-sm mt-1">{analysisResult.studentBuyingBehavior.buyingFrequency}</p>
                    </div>
                  </div>
                </div>

                {/* Product Insights */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-black">
                  <h3 className="font-bold text-black mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-yellow-500" />
                    Product Insights
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">High Demand Products:</span>
                      <div className="mt-1 space-y-1">
                        {analysisResult.productInsights.highDemandProducts.slice(0, 3).map((product, index) => (
                          <div key={index} className="text-sm bg-white rounded p-2 border">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-gray-600 text-xs">{product.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Emerging Categories:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.productInsights.emergingCategories.map((category, index) => (
                          <Badge key={index} className="bg-yellow-100 text-yellow-800 border-yellow-800 text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Recommendations */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-black">
                <h3 className="font-bold text-black mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-purple-500" />
                  Vendor Recommendations for University Events
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Event Vendors:</span>
                    <div className="mt-2 space-y-2">
                      {analysisResult.vendorRecommendations.eventVendors.map((vendor, index) => (
                        <div key={index} className="bg-white rounded p-3 border">
                          <div className="font-medium text-sm">{vendor.category}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Vendors: {vendor.recommendedVendors.join(', ')}
                          </div>
                          <div className="text-xs text-gray-700 mt-1">{vendor.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Partnership Opportunities:</span>
                    <div className="mt-2 space-y-2">
                      {analysisResult.vendorRecommendations.partnerships.map((partnership, index) => (
                        <div key={index} className="bg-white rounded p-3 border">
                          <div className="font-medium text-sm">{partnership.vendor}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Specialty: {partnership.specialty}
                          </div>
                          <div className="text-xs text-gray-700 mt-1">
                            Events: {partnership.eventTypes.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Insights */}
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                <h3 className="font-bold text-black mb-3 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-orange-500" />
                  Actionable Insights
                </h3>
                <ul className="space-y-2">
                  {analysisResult.actionableInsights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="bg-orange-200 text-orange-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Market Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <h4 className="font-bold text-black mb-2">Market Gaps</h4>
                  <ul className="space-y-1">
                    {analysisResult.marketOpportunities.gaps.map((gap, index) => (
                      <li key={index} className="text-sm text-gray-700">• {gap}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-bold text-black mb-2">Expansion Opportunities</h4>
                  <ul className="space-y-1">
                    {analysisResult.marketOpportunities.expansion.map((opportunity, index) => (
                      <li key={index} className="text-sm text-gray-700">• {opportunity}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h4 className="font-bold text-black mb-2">Innovation Ideas</h4>
                  <ul className="space-y-1">
                    {analysisResult.marketOpportunities.innovations.map((innovation, index) => (
                      <li key={index} className="text-sm text-gray-700">• {innovation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Error */}
        {analysisError && (
          <Card className={`${cartoonStyle.card} mb-8 border-red-500`}>
            <CardContent className="p-6">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Analysis Error: {analysisError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className={cartoonStyle.card}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 text-black">
              {/* Search */}
              <div className="flex-1 ">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products, shops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${cartoonStyle.input} pl-10`}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`${cartoonStyle.input} w-full`}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`${cartoonStyle.input} w-full`}
                >
                  <option value="All">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Refresh Button */}
              <Button
                onClick={fetchProducts}
                className={cartoonStyle.button}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <div className="max-w-7xl mx-auto text-black">
        <Card className={cartoonStyle.card}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-black">
                  <tr>
                    <th className="py-4 px-4 text-left">
                      <button
                        onClick={() => toggleSort('name')}
                        className="flex items-center font-bold text-black hover:text-blue-600"
                      >
                        Product
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left">
                      <button
                        onClick={() => toggleSort('shopName')}
                        className="flex items-center font-bold text-black hover:text-blue-600"
                      >
                        Shop
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left">
                      <button
                        onClick={() => toggleSort('price')}
                        className="flex items-center font-bold text-black hover:text-blue-600"
                      >
                        Price
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left">
                      <button
                        onClick={() => toggleSort('stock')}
                        className="flex items-center font-bold text-black hover:text-blue-600"
                      >
                        Stock
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left">Category</th>
                    <th className="py-4 px-4 text-left">Status</th>
                    <th className="py-4 px-4 text-left">Created</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="border-b-2 border-gray-300 hover:bg-yellow-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 mr-3 bg-white rounded-md overflow-hidden flex-shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {product.images && product.images.length > 0 ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-black truncate max-w-xs">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <Store className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium text-black">
                              {shops[product.shopId]?.name || 'Unknown Shop'}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {product.shopId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-black">
                          RM {Number(product.price).toFixed(2)}
                        </span>
                        {product.discountedPrice && (
                          <div className="text-sm text-green-600 font-medium">
                            Discounted: RM {Number(product.discountedPrice).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-black'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-blue-100 rounded-lg text-xs font-bold border-2 border-black text-black">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() => router.push(`/product/${product.id}`)}
                            className={`${cartoonStyle.button} p-2`}
                            title="View Product"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => router.push(`/shop/${product.shopId}`)}
                            className={`${cartoonStyle.button} p-2`}
                            title="View Shop"
                          >
                            <Store className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-bold text-black mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        {sortedProducts.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-gray-700 font-medium">
              Showing {sortedProducts.length} of {products.length} products
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
