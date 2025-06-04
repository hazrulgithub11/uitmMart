"use client"

import { useState, useEffect } from 'react'
import { Home, Search, Bell, User, ShoppingCart, Store, Clock, Package, Loader2 } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Shop } from '@/hooks/useShops'
import { Product } from '@/hooks/useProducts'
import { useSafeQuery } from '@/hooks/useSafeQuery'
import ErrorBoundary from '@/components/ErrorBoundary'
import { format } from 'date-fns'

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Shop page with ErrorBoundary
export default function ShopPage() {
  return (
    <ErrorBoundary>
      <ShopPageContent />
    </ErrorBoundary>
  );
}

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
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-medium line-clamp-2 text-black">{product.name}</h3>
        <p className="text-red-500 font-bold mt-2">
          RM{(() => {
            try {
              return typeof product.price === 'number' 
                ? product.price.toFixed(2) 
                : parseFloat(String(product.price)).toFixed(2);
            } catch (error) {
              console.error("Error formatting price:", error);
              return "0.00"; // Fallback price
            }
          })()}
        </p>
        <div className="flex justify-between items-center mt-2">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border-2 border-blue-800">
            {product.category}
          </span>
          <span className="text-gray-600 text-xs">
            {product.stock !== undefined ? product.stock : 0} left
          </span>
        </div>
      </div>
    </div>
  );
};

// Main content component
function ShopPageContent() {
  const params = useParams();
  const router = useRouter();
  const shopId = Number(params.id);
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  // Navigation items
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Search', url: '/search', icon: Search },
    { name: 'Notifications', url: '/notifications', icon: Bell },
    { name: 'Profile', url: '/profile', icon: User }
  ];
  
  // API URLs
  const shopApiUrl = `/api/public/shops/${shopId}`;
  const productsApiUrl = `/api/public/products?shopId=${shopId}`;
  
  // Fetch shop data
  const { 
    data: shopData, 
    isLoading: shopLoading, 
    error: shopError 
  } = useSafeQuery<Shop>(shopApiUrl, { retries: 1 });
  
  // Fetch shop products
  const { 
    data: productsData, 
    isLoading: productsLoading 
  } = useSafeQuery<Product[]>(productsApiUrl, { retries: 1 });
  
  // Set timeout for loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (shopLoading || productsLoading) {
        setIsTimedOut(true);
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [shopLoading, productsLoading]);
  
  // Handle navigation to cart
  const navigateToCart = () => {
    router.push('/cart');
  };
  
  // Format date for "Joined Since"
  const formatJoinedDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM yyyy');
    } catch {
      return "Unknown";
    }
  };
  
  // Loading state
  if (shopLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
        <NavBar items={navItems} />
        <div className="pt-32 px-4 mx-auto max-w-6xl">
          <div className={`${cartoonStyle.card} text-black text-center py-12 flex flex-col items-center`}>
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-500" />
            <p className="text-lg font-medium">
              {isTimedOut ? 
                "Loading is taking longer than expected. The database might be starting up..." : 
                "Loading shop information..."}
            </p>
            {isTimedOut && (
              <button 
                onClick={() => router.push('/main')}
                className={`${cartoonStyle.buttonPrimary} mt-6 px-6 py-2`}
              >
                Return to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (shopError || !shopData) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
        <NavBar items={navItems} />
        <div className="pt-32 px-4 mx-auto max-w-6xl">
          <div className={`${cartoonStyle.card} text-black text-center py-12`}>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Shop Not Found</h2>
            <p className="mb-6">Sorry, we couldn&apos;t find the shop you&apos;re looking for.</p>
            <button 
              onClick={() => router.push('/main')}
              className={`${cartoonStyle.buttonPrimary} px-6 py-2`}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get shop information
  const { name, description, logoUrl, createdAt } = shopData;
  const products = productsData || [];
  
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center pb-12">
      {/* Navigation bar */}
      <NavBar items={navItems} />
      
      {/* Content area */}
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
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search in this shop..."
              className={`${cartoonStyle.input} w-full py-2 pl-10 pr-4 text-black`}
            />
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
        
        {/* Shop Header */}
        <div className={`${cartoonStyle.card} mb-6 bg-gradient-to-r from-blue-50 to-indigo-50`}>
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Shop Logo */}
            <div className="relative w-32 h-32 rounded-full border-4 border-black overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <Image
                src={logoUrl || "/images/placeholder.svg"}
                alt={name}
                fill
                className="object-cover"
              />
            </div>
            
            {/* Shop Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className={`${cartoonStyle.heading} text-black mb-2`}>{name}</h1>
              
              <div className="flex flex-col md:flex-row gap-4 md:items-center mt-2 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">
                    Joined since {formatJoinedDate(createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">
                    {products.length} Products
                  </span>
                </div>
              </div>
              
              {description && (
                <p className="text-gray-700 mt-2">{description}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Products Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 text-black flex items-center gap-2">
            <Store className="h-6 w-6" />
            All Products
          </h2>
          
          {products.length === 0 ? (
            <div className={`${cartoonStyle.card} py-10 text-center bg-white`}>
              <p className="text-gray-600">This shop doesn&apos;t have any products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 