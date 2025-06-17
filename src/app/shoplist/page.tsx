"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Home, Search, User, ShoppingCart, Store, Star, ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import Link from 'next/link'

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

interface Product {
  id: number;
  name: string;
  price: number | string | unknown;
  images: string[];
  category?: string;
  description?: string;
}

interface Shop {
  id: number;
  name: string;
  logoUrl: string | null;
  description: string | null;
  _count: {
    orders: number;
    products: number;
  };
  totalSales: number;
}

interface PaginationProps {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function ShopListPage() {
  const router = useRouter()
  
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Offers', url: '/offers', icon: Star },
    { name: 'Mall', url: '/mall', icon: Store },
    { name: 'Profile', url: '/profile', icon: User }
  ]
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // State for shops
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationProps>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1
  });

  // Close suggestions when clicking outside
  useOnClickOutside(searchRef, () => setShowSuggestions(false));
  
  // Fetch all products for search suggestions
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await fetch('/api/public/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setAllProducts(data);
      } catch (err) {
        console.error('Error loading products for search suggestions:', err);
      }
    };
    
    fetchAllProducts();
  }, []);
  
  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoadingShops(true);
        setShopError(null);
        
        const response = await fetch(`/api/public/shops?page=${pagination.page}&limit=${pagination.limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch shops');
        }
        
        const data = await response.json();
        setShops(data.shops || []);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error loading shops:', err);
        setShopError(err instanceof Error ? err.message : 'Failed to load shops');
      } finally {
        setIsLoadingShops(false);
      }
    };
    
    fetchShops();
  }, [pagination.page, pagination.limit]);

  // Safely convert any price value to a number
  const safeParseFloat = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    if (value && typeof value === 'object') {
      // Handle Decimal or any object with toString
      return parseFloat(String(value));
    }
    return 0; // Fallback
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Filter products for suggestions
    if (value.trim().length > 0) {
      const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(value.toLowerCase()) || 
        product.category?.toLowerCase().includes(value.toLowerCase()) ||
        product.description?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (productId: number) => {
    router.push(`/product/${productId}`);
    setShowSuggestions(false);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center pb-20">
      {/* Navigation bar */}
      <NavBar items={navItems} />
      
      {/* Content - with significant top padding to clear the navbar */}
      <div className="pt-32 px-4 mx-auto max-w-4xl">
        {/* Search bar with logo and cart */}
        <div className="flex items-center gap-4 mb-6">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Image 
              src="/images/logo2.png" 
              alt="Logo" 
              width={40} 
              height={40}
              className="rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
          
          {/* Search bar in the middle */}
          <div ref={searchRef} className="relative flex-grow">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={`${cartoonStyle.input} w-full py-2 pl-10 pr-4 text-black`}
              />
            </form>
            
            {/* Search suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] max-h-60 overflow-auto">
                {suggestions.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => handleSuggestionClick(product.id)}
                    className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b-2 border-gray-200 last:border-b-0"
                  >
                    <div className="w-10 h-10 mr-3 overflow-hidden rounded border-2 border-black flex-shrink-0">
                      <Image
                        src={product.images?.[0] || '/images/placeholder.svg'}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm font-bold text-black truncate">{product.name}</div>
                      <div className="text-xs text-gray-600">{product.category}</div>
                    </div>
                    <div className="text-sm font-semibold text-black">
                      RM {typeof product.price === 'number' 
                        ? product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : safeParseFloat(product.price).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Cart icon on the right */}
          <div className="flex-shrink-0">
            <button 
              onClick={() => router.push('/cart')}
              className={`${cartoonStyle.button} p-2 rounded-full text-black`}
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Back to Mall Link */}
        <div className="mb-4">
          <Link 
            href="/mall" 
            className="text-blue-600 flex items-center text-sm font-medium hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Mall
          </Link>
        </div>
        
        {/* All Shops Section */}
        <div className="mb-8">
          <div className={`${cartoonStyle.card} p-0 overflow-hidden`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4">
              <h1 className="text-xl md:text-2xl font-bold text-white">All Shops</h1>
            </div>
            
            {/* Shop Grid */}
            <div className="p-4 bg-white">
              {isLoadingShops ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : shopError ? (
                <div className="text-center py-8 text-red-500">
                  <p>Failed to load shops</p>
                </div>
              ) : shops.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Store className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No shops found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {shops.map((shop) => (
                      <Link 
                        href={`/shop/${shop.id}`}
                        key={shop.id}
                        className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all"
                      >
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-black overflow-hidden bg-white flex items-center justify-center">
                          {shop.logoUrl ? (
                            <Image 
                              src={shop.logoUrl} 
                              alt={shop.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="h-10 w-10 text-gray-400" />
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-center line-clamp-1 text-black">{shop.name}</p>
                        <div className="mt-1 text-xs text-gray-500">
                          {shop._count.products} products
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`${cartoonStyle.button} px-3 py-1 ${
                          pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === pagination.pages || 
                            Math.abs(page - pagination.page) <= 1
                          )
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 py-1">...</span>
                              )}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`${
                                  page === pagination.page
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-black'
                                } border-2 border-black rounded-md w-8 h-8 flex items-center justify-center`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))
                        }
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className={`${cartoonStyle.button} px-3 py-1 ${
                          pagination.page === pagination.pages ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
