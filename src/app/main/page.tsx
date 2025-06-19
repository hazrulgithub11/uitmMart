"use client"

import { Home, Search, User, ShoppingCart, BookOpen, PenTool, FileText, Laptop, Usb, 
         Shirt, Footprints, Watch, Scissors, Cookie, Pizza, Coffee, Sofa, Bed, Lamp, 
         GraduationCap, FileCode, Gamepad, Headphones, ChevronRight, ChevronLeft, Star, Store } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { Product } from '@/hooks/useProducts'
import { useRouter } from 'next/navigation'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Check if a discount is currently active

const isDiscountActive = (product: Product) => {
  if (!product?.discountPercentage) return false;
  
  const now = new Date();
  const startDate = product.discountStartDate ? new Date(product.discountStartDate) : null;
  const endDate = product.discountEndDate ? new Date(product.discountEndDate) : null;
  
  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  
  return true;
};

export default function MainPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useOnClickOutside(searchRef, () => setShowSuggestions(false));

  // Fetch products when the component mounts
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch from public API endpoint
        const response = await fetch('/api/public/products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Filter products for suggestions
    if (value.trim().length > 0) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(value.toLowerCase()) || 
        product.category.toLowerCase().includes(value.toLowerCase()) ||
        product.description.toLowerCase().includes(value.toLowerCase())
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

  // Navigation items
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Offers', url: '/offers', icon: Star },
    { name: 'Mall', url: '/mall', icon: Store },
    { name: 'Profile', url: '/profile', icon: User }
  ];

  // Split categories into two rows of 10 each
  const categoriesRow1 = [
    // Study & Academic Supplies
    { name: 'Textbooks & Reference', icon: BookOpen },
    { name: 'Stationery', icon: PenTool },
    { name: 'Past Year Papers', icon: FileText },
    { name: 'Electronics', icon: Laptop },
    { name: 'USB & Storage', icon: Usb },
    
    // Fashion & Personal Items
    { name: 'Clothing', icon: Shirt },
    { name: 'Shoes & Sneakers', icon: Footprints },
    { name: 'Accessories', icon: Watch },
    { name: 'Self-Care & Grooming', icon: Scissors },
    { name: 'Snacks & Instant Food', icon: Cookie },
  ]
  
  const categoriesRow2 = [
    { name: 'Homemade Food', icon: Pizza },
    { name: 'Beverages', icon: Coffee },
    { name: 'Furniture', icon: Sofa },
    { name: 'Bedding & Pillows', icon: Bed },
    { name: 'Room Decorations', icon: Lamp },
    { name: 'Tutoring Services', icon: GraduationCap },
    { name: 'Resume/Templates', icon: FileCode },
    { name: 'Digital Art', icon: FileCode },
    { name: 'Board Games', icon: Gamepad },
    { name: 'Tech Gadgets', icon: Headphones },
  ]
  
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
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
                <Search className="h-5 w-5 text-zinc-400" />
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
                        src={product.images[0] || '/images/placeholder.svg'}
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
                    <div className="text-sm font-semibold">
                      {product.discountPercentage && isDiscountActive(product) ? (
                        <div className="flex flex-col items-end">
                          <span className="text-gray-500 text-xs line-through">
                            RM {product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-red-500">
                            RM {Number(product.discountedPrice).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-black">
                          RM {product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Cart icon on the right */}
          <div className="flex-shrink-0">
            <button 
              className={`${cartoonStyle.button} p-2 rounded-full bg-white text-black`}
              onClick={() => window.location.href = '/cart'}
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Banner Images Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Main banner (spans full width on mobile, 2 columns on desktop) */}
          <div className="md:col-span-2 rounded-xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Image
              src="/images/beginning.png"
              alt="Main Promotion"
              width={800}
              height={300}
              className="w-full h-auto object-cover"
            />
          </div>
          
          {/* Two vertical banners stacked on the right (full width on mobile) */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl overflow-hidden border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <Image
                src="/images/research.png"
                alt="Promotion 1"
                width={400}
                height={145}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="rounded-xl overflow-hidden border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <Image
                src="/images/launch.png"
                alt="Promotion 2"
                width={400}
                height={145}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* Categories Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`${cartoonStyle.heading} text-black`}>CATEGORIES</h2>
          </div>
          
          {/* First row of categories */}
          <div className="relative mb-6">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('category-row-1')
                  if (container) container.scrollBy({ left: -320, behavior: 'smooth' })
                }}
                className={`${cartoonStyle.button} p-1 bg-white rounded-full hover:bg-white text-black`}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('category-row-1')
                  if (container) container.scrollBy({ left: 320, behavior: 'smooth' })
                }}
                className={`${cartoonStyle.button} p-1 bg-white rounded-full hover:bg-white text-black`}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            
            <div 
              id="category-row-1"
              className="flex overflow-x-auto gap-4 pb-2 px-8 hide-scrollbar"
            >
              {categoriesRow1.map((category, index) => {
                const Icon = category.icon;
                return (
                  <a
                    key={index}
                    href={`/category/${encodeURIComponent(category.name)}`}
                    className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mb-2 border-2 border-black">
                      <Icon className="h-6 w-6 text-black" />
                    </div>
                    <span className="text-center text-xs font-bold text-black">{category.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
          
          {/* Second row of categories */}
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('category-row-2')
                  if (container) container.scrollBy({ left: -320, behavior: 'smooth' })
                }}
                className={`${cartoonStyle.button} p-1 bg-white rounded-full hover:bg-white text-black`}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('category-row-2')
                  if (container) container.scrollBy({ left: 320, behavior: 'smooth' })
                }}
                className={`${cartoonStyle.button} p-1 bg-white rounded-full hover:bg-white text-black`}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            
            <div 
              id="category-row-2"
              className="flex overflow-x-auto gap-4 pb-2 px-8 hide-scrollbar"
            >
              {categoriesRow2.map((category, index) => {
                const Icon = category.icon;
                return (
                  <a
                    key={index}
                    href={`/category/${encodeURIComponent(category.name)}`}
                    className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mb-2 border-2 border-black">
                      <Icon className="h-6 w-6 text-black" />
                    </div>
                    <span className="text-center text-xs font-bold text-black">{category.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Product Showcase Section */}
        <div className="mb-8">
          <div className="flex flex-col items-center mb-6">
            <h2 className={`${cartoonStyle.heading} text-black mb-2`}>DAILY DISCOVER</h2>
            <div className="w-32 h-0.5 bg-blue-500 relative border-2 border-black">
              <div className="absolute inset-0 bg-blue-500 blur-sm"></div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <a 
                  key={product.id} 
                  href={`/product/${product.id}`}
                  className={`${cartoonStyle.card} bg-white block relative`}
                >
                  {/* Product card */}
                  <div className="w-full h-40 overflow-hidden rounded-lg border-3 border-black mb-3">
                    <Image
                      src={product.images[0] || '/images/placeholder.svg'}
                      alt={product.name}
                      width={200}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                    {/* Discount Badge - only show if discount is active */}
                    {product.discountPercentage && isDiscountActive(product) && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                        {product.discountPercentage}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm text-black font-bold truncate">{product.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="bg-blue-500 text-white text-xs px-2 rounded border-2 border-black font-bold">
                        {product.category}
                      </div>
                    </div>
                    {product.discountPercentage && isDiscountActive(product) ? (
                      <div className="mt-1">
                        <span className="text-gray-500 text-xs line-through block">
                          RM {product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-red-500 font-semibold">
                          RM {Number(product.discountedPrice).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 text-black font-semibold">
                        RM {product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
        
        {/* CSS for hiding scrollbar */}
        <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  )
}
