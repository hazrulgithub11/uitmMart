"use client"

import { useState, useEffect, useRef } from 'react'
import { Home, Search, User, ShoppingCart, Store, Loader2, Star, Tag } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { Product } from '@/hooks/useProducts'

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Product Card Component
const ProductCard = ({ product }: { product: Product }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/product/${product.id}`);
  };
  
  return (
    <div 
      className="bg-white border-4 border-black rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden cursor-pointer transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] hover:-translate-y-1"
      onClick={handleClick}
    >
      {/* Product Image */}
      <div className="relative w-full aspect-square">
        <Image
          src={product.images[0] || "/images/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover"
        />
        {/* Discount Badge */}
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
          {product.discountPercentage}% OFF
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-medium line-clamp-2 text-black">{product.name}</h3>
        <div className="mt-2">
          <p className="text-gray-500 text-sm line-through">
            RM{typeof product.price === 'number' 
              ? product.price.toFixed(2) 
              : parseFloat(String(product.price)).toFixed(2)}
          </p>
          <p className="text-red-500 font-bold">
            RM{typeof product.discountedPrice === 'number' 
              ? product.discountedPrice.toFixed(2) 
              : parseFloat(String(product.discountedPrice)).toFixed(2)}
          </p>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border-2 border-blue-800">
            {product.category}
          </span>
          <span className="text-gray-600 text-xs">
            {product.stock} left
          </span>
        </div>
      </div>
    </div>
  );
};

export default function OffersPage() {
  const router = useRouter();
  // These variables are kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { status } = useSession();
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useOnClickOutside(searchRef, () => setShowSuggestions(false));

  // Fetch all discounted products
  useEffect(() => {
    const fetchDiscountedProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public/products?discounted=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const discountedProducts = await response.json();
        setDiscountedProducts(discountedProducts);
      } catch (err) {
        console.error('Error fetching discounted products:', err);
        setError('Failed to load discounted products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscountedProducts();
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Filter products for suggestions
    if (value.trim().length > 0) {
      const filtered = discountedProducts.filter(product => 
        product.name.toLowerCase().includes(value.toLowerCase()) || 
        product.category.toLowerCase().includes(value.toLowerCase())
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

  // Navigate to cart page
  const navigateToCart = () => {
    router.push('/cart');
  };

  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Offers', url: '/offers', icon: Star },
    { name: 'Mall', url: '/mall', icon: Store },
    { name: 'Profile', url: '/profile', icon: User }
  ];

  // Filter products based on search query
  const filteredProducts = searchQuery.trim() 
    ? discountedProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : discountedProducts;

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
      {/* Navigation bar */}
      <NavBar items={navItems} />
      
      {/* Content - with significant top padding to clear the navbar */}
      <div className="pt-32 px-4 mx-auto max-w-6xl">
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
                placeholder="Search discounted products..."
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
                    <div className="text-sm font-semibold text-red-500">
                      RM {Number(product.discountedPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Cart icon on the right */}
          <div className="flex-shrink-0">
            <button 
              onClick={navigateToCart}
              className={`${cartoonStyle.button} p-2 rounded-full bg-white text-black`}
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className={`${cartoonStyle.card} mb-8 bg-red-50`}>
          <div className="flex items-center gap-4">
            <div className="bg-red-500 p-3 rounded-full border-3 border-black">
              <Tag className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`${cartoonStyle.card.replace('bg-white', '')} border-0 shadow-none p-0 text-2xl font-extrabold text-black`}>
                Special Offers & Discounts
              </h1>
              <p className="text-gray-700">Discover great deals and save big on your favorite products!</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className={`${cartoonStyle.card} text-center py-12`}>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-black font-bold">Loading discounted products...</p>
          </div>
        ) : error ? (
          <div className={`${cartoonStyle.card} text-center py-12`}>
            <p className="text-red-500 font-bold mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className={`${cartoonStyle.buttonPrimary} px-4 py-2`}
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={`${cartoonStyle.card} text-center py-12`}>
            <p className="text-black font-bold mb-4">
              {searchQuery.trim() ? 'No matching discounted products found.' : 'No discounted products available right now.'}
            </p>
            <button 
              onClick={() => router.push('/main')}
              className={`${cartoonStyle.buttonPrimary} px-4 py-2`}
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div>
            {searchQuery.trim() && (
              <p className="mb-4 text-black font-medium">
                Found {filteredProducts.length} discounted products matching &quot;{searchQuery}&quot;
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 