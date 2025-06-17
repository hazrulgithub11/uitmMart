"use client"

import { useState, useRef, useEffect } from 'react'
import { Home, Search, User, ShoppingCart, Store, Star, ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import ScrollVelocity from '@/components/ui/ScrollVelocity'
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

export default function MallPage() {
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

  // State for image slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3; // Number of promotion slides
  
  // State for scroll velocity
  const [velocity, setVelocity] = useState(50);
  
  // State for trending shops
  const [trendingShops, setTrendingShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);
  
  // Placeholder images for the slider
  const promotionSlides = [
    '/images/placeholder.svg',
    '/images/placeholder.svg',
    '/images/placeholder.svg'
  ];

  // Function to move to next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  // Function to move to previous slide
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  // Auto slide change
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Update velocity based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Adjust velocity based on scroll position
      setVelocity(50 + scrollY / 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  
  // Fetch trending shops
  useEffect(() => {
    const fetchTrendingShops = async () => {
      try {
        setIsLoadingShops(true);
        setShopError(null);
        
        const response = await fetch('/api/public/shops?limit=10');
        if (!response.ok) {
          throw new Error('Failed to fetch trending shops');
        }
        
        const data = await response.json();
        setTrendingShops(data.shops || []);
      } catch (err) {
        console.error('Error loading trending shops:', err);
        setShopError(err instanceof Error ? err.message : 'Failed to load trending shops');
      } finally {
        setIsLoadingShops(false);
      }
    };
    
    fetchTrendingShops();
  }, []);

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

        {/* Promotion Image Slider */}
        <div className="mb-8 relative">
          <div className={`${cartoonStyle.card} p-0 overflow-hidden`}>
            <div className="relative h-[200px] md:h-[300px] w-full">
              {/* Slider Images */}
              {promotionSlides.map((slide, index) => (
                <div 
                  key={index}
                  className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ease-in-out ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center">
                    <div className="text-white text-xl font-bold">Promotion Slide {index + 1}</div>
                  </div>
                </div>
              ))}
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full border-2 border-black ${
                      index === currentSlide ? 'bg-red-500' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Velocity Text */}
        <div className="mb-8">
          <div className={`${cartoonStyle.card} p-4 overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600`}>
            <ScrollVelocity
              texts={['UiTM Mart Mall', 'Built for Students']}
              velocity={velocity}
              className="text-white font-bold"
              numCopies={4}
              parallaxStyle={{ margin: '1rem 0' }}
            />
          </div>
        </div>
        
        {/* Trending Brands & Shops Section */}
        <div className="mb-8">
          <div className={`${cartoonStyle.card} p-0 overflow-hidden`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-white">TRENDING BRANDS & SHOPS</h2>
              <Link href="/shoplist" className="text-white flex items-center text-sm hover:underline">
                See All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            {/* Shop Grid */}
            <div className="p-4 bg-white">
              {isLoadingShops ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : shopError ? (
                <div className="text-center py-8 text-red-500">
                  <p>Failed to load trending shops</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {trendingShops.slice(0, 10).map((shop) => (
                      <Link 
                        href={`/shop/${shop.id}`}
                        key={shop.id}
                        className="flex flex-col items-center p-2 border-2 border-gray-200 rounded-lg hover:border-red-500 transition-colors"
                      >
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-black overflow-hidden bg-white flex items-center justify-center">
                          {shop.logoUrl ? (
                            <Image 
                              src={shop.logoUrl} 
                              alt={shop.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <p className="mt-2 text-xs md:text-sm font-medium text-center line-clamp-1 text-black">{shop.name}</p>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="flex justify-center mt-4 md:hidden">
                    <Link href="/shoplist" className="text-red-600 flex items-center text-sm font-medium">
                      See All <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
         
      </div>
    </div>
  )
}
