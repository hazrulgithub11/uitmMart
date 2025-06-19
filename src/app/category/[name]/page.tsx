"use client"

import { Home, Search, User, ShoppingCart, Star, Store } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Product } from '@/hooks/useProducts'
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

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = params.name as string;
  const decodedCategoryName = decodeURIComponent(categoryName);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useOnClickOutside(searchRef, () => setShowSuggestions(false));

  // Fetch products by category when the component mounts
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch from public API endpoint with category filter
        const response = await fetch(`/api/public/products?category=${encodeURIComponent(decodedCategoryName)}`);
        
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
  }, [decodedCategoryName]);

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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Filter products for suggestions
    if (value.trim().length > 0) {
      const filtered = allProducts.filter(product => 
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

  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Offers', url: '/offers', icon: Star },
    { name: 'Mall', url: '/mall', icon: Store },
    { name: 'Profile', url: '/profile', icon: User }
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
                    <div className="text-sm font-semibold text-black">
                      RM {product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex flex-col items-center mb-6">
            <h2 className={`${cartoonStyle.heading} text-black mb-2`}>{decodedCategoryName}</h2>
            <div className="w-32 h-0.5 bg-blue-500 relative border-2 border-black">
              <div className="absolute inset-0 bg-blue-500 blur-sm"></div>
            </div>
          </div>
        </div>
        
        {/* Product List Section */}
        <div className="mb-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-bold text-gray-700">No products found in this category</p>
              <button 
                onClick={() => window.location.href = '/main'}
                className={`${cartoonStyle.buttonPrimary} mt-4 px-4 py-2 text-white`}
              >
                Back to Home
              </button>
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
                    {/* Discount Badge */}
                    {product.discountPercentage && (
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
                    {product.discountPercentage ? (
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
      </div>
    </div>
  )
} 