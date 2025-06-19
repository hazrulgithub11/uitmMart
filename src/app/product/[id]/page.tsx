"use client"

import { Home, Search, User, ShoppingCart, Minus, Plus, MessageSquare, Store, Loader2, Check, Star } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Product } from '@/hooks/useProducts'
import { Shop } from '@/hooks/useShops'
import { useSafeQuery } from '@/hooks/useSafeQuery'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'

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

// Define type for product with shop included
interface ProductWithShop extends Product {
  shop: Shop & {
    seller?: {
      id: number;
      fullName: string;
      email: string;
    }
  }
}

// Define Rating interface
interface Rating {
  id: number;
  stars: number;
  comment: string | null;
  createdAt: string;
  userId: number;
  productId: number;
  orderId: number;
  user?: {
    username: string;
    profileImage?: string;
  };
}

// Success Popup Component
function SuccessPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black rounded-2xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center border-3 border-black mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2">Item has been added to your shopping cart</h3>
          <div className="flex items-center justify-between w-full mt-6">
            <button 
              onClick={onClose}
              className={`${cartoonStyle.button} px-4 py-2 text-black`}
            >
              Continue Shopping
            </button>
            <button 
              onClick={() => window.location.href = '/cart'}
              className={`${cartoonStyle.buttonDanger} px-4 py-2 text-white`}
            >
              Go to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <ErrorBoundary>
      <ProductDetailContent />
    </ErrorBoundary>
  );
}

function ProductDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const productId = Number(params.id)
  const [quantity, setQuantity] = useState(1)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [ratingsLoading, setRatingsLoading] = useState(true)
  const [ratingsError, setRatingsError] = useState<Error | null>(null)
  const [averageRating, setAverageRating] = useState<number>(0)
  const [totalRatings, setTotalRatings] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useOnClickOutside(searchRef, () => setShowSuggestions(false))

  // Use public API endpoint for product data (now includes shop data)
  const productApiUrl = `/api/public/products/${productId}`;
  
  // Use the safe query hook to prevent infinite loading loops
  const { 
    data: productData, 
    isLoading: productLoading, 
    error: productError,
  } = useSafeQuery<ProductWithShop>(productApiUrl, { 
    retries: 1
  })

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
        console.error('Error loading products for search:', err);
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
  
  // Set a timeout to prevent long loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productLoading) {
        setIsTimedOut(true);
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [productLoading]);
  
  // Extract product and shop from the response
  const product = productData;
  const shop = product?.shop;

  // Fetch product ratings
  useEffect(() => {
    async function fetchRatings() {
      if (!productId) return;
      
      setRatingsLoading(true);
      try {
        const response = await fetch(`/api/ratings?productId=${productId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ratings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Ratings data:', data);
        
        if (data.success) {
          setRatings(data.ratings);
          setAverageRating(data.averageRating || 0);
          setTotalRatings(data.totalRatings || 0);
        } else {
          throw new Error(data.message || 'Failed to fetch ratings');
        }
      } catch (error) {
        console.error('Error fetching product ratings:', error);
        setRatingsError(error instanceof Error ? error : new Error('Unknown error fetching ratings'));
      } finally {
        setRatingsLoading(false);
      }
    }
    
    fetchRatings();
  }, [productId]);

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Offers', url: '/offers', icon: Star },
    { name: 'Mall', url: '/mall', icon: Store },
    { name: 'Profile', url: '/profile', icon: User }
  ]

  // Use sample image paths for development since the mock images might not exist
  const getImagePath = (imagePath: string | null | undefined): string => {
    if (!imagePath) {
      return "/images/placeholder.svg";
    }
    
    if (!imagePath.startsWith('http')) {
      return imagePath; // Use relative paths as-is
    }
    
    return imagePath;
  };

  const getShopImagePath = (imagePath: string | null | undefined): string => {
    if (!imagePath) {
      return "/images/placeholder.svg";
    }
    
    if (!imagePath.startsWith('http')) {
      return imagePath; // Use relative paths as-is
    }
    
    return imagePath;
  };

  // Handle Add to Cart
  const handleAddToCart = async () => {
    // Check if user is logged in
    if (status !== 'authenticated') {
      toast.error('Please log in to add items to your cart')
      router.push('/login?callbackUrl=' + encodeURIComponent(`/product/${productId}`))
      return
    }

    // Check if product is available
    if (!product || product.status !== 'active') {
      toast.error('This product is not available')
      return
    }

    setIsAddingToCart(true)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          variation: "", // Empty string instead of null to avoid Prisma error
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add to cart')
      }

      // Show custom success popup instead of toast
      setShowSuccessPopup(true)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Handle Buy Now
  const handleBuyNow = async () => {
    // First add to cart
    try {
      await handleAddToCart()
      // Only navigate if adding to cart was successful
      if (!isAddingToCart && !showSuccessPopup) {
        router.push('/cart')
      }
    } catch (error) {
      console.error('Error with buy now:', error)
    }
  }

  // Navigate to cart page
  const navigateToCart = () => {
    router.push('/cart')
  }

  // Helper function to render star ratings
  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            fill={star <= rating ? "currentColor" : "#e5e7eb"}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
      {/* Navigation bar */}
      <NavBar items={navItems} />
      
      {/* Success Popup */}
      {showSuccessPopup && (
        <SuccessPopup onClose={() => setShowSuccessPopup(false)} />
      )}
      
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
              onClick={navigateToCart}
              className={`${cartoonStyle.button} p-2 rounded-full bg-white text-black`}
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Product Detail Content */}
        {productLoading ? (
          <div className={`${cartoonStyle.card} text-black text-center py-8 flex flex-col items-center`}>
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p>{isTimedOut ? 
              "Loading is taking longer than expected. The database might be starting up..." : 
              "Loading product details..."}
            </p>
            {isTimedOut && (
              <button 
                onClick={() => router.push('/main')}
                className={`${cartoonStyle.buttonPrimary} mt-4 px-4 py-2`}
              >
                Back to Home
              </button>
            )}
          </div>
        ) : productError ? (
          <div className={`${cartoonStyle.card} text-red-500 text-center py-8`}>
            <p>Error: {productError.message}</p>
            <button 
              onClick={() => router.push('/main')}
              className={`${cartoonStyle.buttonPrimary} mt-4 px-4 py-2`}
            >
              Back to Home
            </button>
          </div>
        ) : !product ? (
          <div className={`${cartoonStyle.card} text-black text-center py-8`}>
            <p>Product not found</p>
            <button 
              onClick={() => router.push('/main')}
              className={`${cartoonStyle.buttonPrimary} mt-4 px-4 py-2`}
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Product Image */}
              <div className={`${cartoonStyle.card} p-4 bg-white`}>
                <Image
                  src={getImagePath(product.images[0])}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="w-full h-auto object-contain border-3 border-black rounded-xl"
                />
              </div>
              
              {/* Product Details */}
              <div className={`${cartoonStyle.card} bg-white text-black`}>
                {/* Title */}
                <h1 className={`${cartoonStyle.heading} mb-4`}>{product.name}</h1>
                
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    {product.discountPercentage && isDiscountActive(product) ? (
                      <>
                        <div className="flex flex-col">
                          <span className="text-gray-500 line-through">
                            RM{product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-3xl font-bold text-red-500">
                            RM{Number(product.discountedPrice).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-bold rounded-full border-2 border-red-800">
                          {product.discountPercentage}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-red-500">
                        RM{product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  
                  {/* Display discount status if there is a discount but not active */}
                  {product.discountPercentage && !isDiscountActive(product) && (
                    <div className="mt-2">
                      {product.discountStartDate && new Date(product.discountStartDate) > new Date() ? (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md border border-blue-800">
                          Discount scheduled: {new Date(product.discountStartDate).toLocaleDateString()}
                          {product.discountEndDate && ` - ${new Date(product.discountEndDate).toLocaleDateString()}`}
                        </span>
                      ) : product.discountEndDate && new Date(product.discountEndDate) < new Date() ? (
                        <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-md border border-gray-800">
                          Discount expired: {new Date(product.discountEndDate).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  )}
                  
                  <div className="mt-1">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded border-2 border-black font-bold">
                      {product.category}
                    </span>
                  </div>
                </div>
                
                {/* Stock Status */}
                <div className="mb-6">
                  <p className="text-gray-700 font-medium">
                    {product.stock} pieces available
                  </p>
                  <p className="text-gray-700 font-medium mt-1">
                    Status: <span className={product.status === 'active' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                      {product.status === 'active' ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </p>
                </div>
                
                {/* Quantity Selector */}
                <div className="mb-6">
                  <p className="text-gray-700 font-bold mb-2">Quantity</p>
                  <div className="flex items-center">
                    <button 
                      onClick={decreaseQuantity} 
                      className="bg-white border-3 border-black rounded-l-md p-2 hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-5 w-5 text-black" />
                    </button>
                    
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      className="bg-white border-t-3 border-b-3 border-black w-16 text-center py-2 text-black"
                    />
                    
                    <button 
                      onClick={increaseQuantity} 
                      className="bg-white border-3 border-black rounded-r-md p-2 hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-5 w-5 text-black" />
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button 
                    className={`flex-1 ${cartoonStyle.button} border-3 border-red-500 text-red-500 font-bold py-3 rounded-md flex justify-center items-center`}
                    disabled={product.status !== 'active' || isAddingToCart}
                    onClick={handleAddToCart}
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Add To Cart
                  </button>
                  <button 
                    className={`flex-1 ${cartoonStyle.buttonDanger} py-3 rounded-md flex justify-center items-center`}
                    disabled={product.status !== 'active' || isAddingToCart}
                    onClick={handleBuyNow}
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
            
            {/* Shop Information Section */}
            <div className={`${cartoonStyle.card} p-4 mt-6 mb-6 bg-yellow-50`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 mb-4 sm:mb-0" 
                     onClick={() => router.push(`/shop/${product.shopId}`)}
                     style={{ cursor: 'pointer' }}>
                  <Image 
                    src={getShopImagePath(shop?.logoUrl)}
                    alt={shop?.name || "Shop Logo"}
                    width={64}
                    height={64}
                    className="rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <div>
                    <h3 className="text-black font-bold hover:text-blue-600">
                      {productLoading ? "Loading shop info..." : 
                        shop ? shop.name : "Shop not found"}
                    </h3>
                    <p className="text-gray-700 font-medium text-sm">
                      {productLoading ? "Loading..." : 
                        shop?.seller ? `Owner: ${shop.seller.fullName}` : "Shop details unavailable"}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button className={`${cartoonStyle.buttonDanger} flex items-center justify-center gap-2 px-4 py-2`}>
                    <MessageSquare size={16} />
                    <span>Chat Now</span>
                  </button>
                  <button 
                    className={`${cartoonStyle.button} flex items-center justify-center gap-2 px-4 py-2 text-black`}
                    onClick={() => router.push(`/shop/${product.shopId}`)}
                  >
                    <Store size={16} />
                    <span>View Shop</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Product Specifications Section */}
            <div className={`${cartoonStyle.card} mt-6 mb-6 bg-white p-4`}>
              <h2 className={`${cartoonStyle.heading} text-black mb-4`}>Product Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-black pt-4">
                <div className="flex">
                  <div className="w-32 text-gray-700 font-bold">Stock</div>
                  <div className="text-black">{product.stock}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-gray-700 font-bold">Category</div>
                  <div className="text-black">{product.category}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-gray-700 font-bold">Status</div>
                  <div className={product.status === 'active' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {product.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-32 text-gray-700 font-bold">Created</div>
                  <div className="text-black">{new Date(product.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            {/* Product Description Section */}
            <div className={`${cartoonStyle.card} mt-6 bg-white p-4`}>
              <h2 className={`${cartoonStyle.heading} text-black mb-4`}>Product Description</h2>
              <div className="text-black whitespace-pre-line border-t-2 border-black pt-4">
                {product.description}
              </div>
            </div>
            
            {/* Product Ratings Section */}
            <div className={`${cartoonStyle.card} mt-6 bg-white p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`${cartoonStyle.heading} text-black`}>Product Ratings</h2>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-red-500 mr-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star} 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        fill={star <= Math.round(averageRating) ? "currentColor" : "#e5e7eb"}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600 text-black">({totalRatings} ratings)</span>
                </div>
              </div>
              
              <div className="border-t-2 border-black pt-4">
                {ratingsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin inline-block mb-2" />
                    <p className="text-black">Loading ratings...</p>
                  </div>
                ) : ratingsError ? (
                  <div className="text-center py-8 text-red-500">
                    <p>Error loading ratings: {ratingsError.message}</p>
                    <p className="text-sm mt-2">Please try again later.</p>
                  </div>
                ) : ratings.length === 0 ? (
                  <div className="text-center py-8 text-black">
                    <p>No ratings yet for this product.</p>
                    <p className="text-sm text-gray-500 mt-2">Be the first to rate this product!</p>
                  </div>
                ) : (
                  <>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <button className={`${cartoonStyle.button} py-1 px-3 text-xs text-black`}>All Reviews</button>
                      <button className={`bg-white border border-gray-300 py-1 px-3 rounded-md text-xs text-black`}>
                        5 Star ({ratings.filter(r => r.stars === 5).length})
                      </button>
                      <button className={`bg-white border border-gray-300 py-1 px-3 rounded-md text-xs text-black`}>
                        4 Star ({ratings.filter(r => r.stars === 4).length})
                      </button>
                      <button className={`bg-white border border-gray-300 py-1 px-3 rounded-md text-xs text-black`}>
                        3 Star ({ratings.filter(r => r.stars === 3).length})
                      </button>
                      <button className={`bg-white border border-gray-300 py-1 px-3 rounded-md text-xs text-black`}>
                        With Comments ({ratings.filter(r => r.comment && r.comment.trim() !== '').length})
                      </button>
                    </div>
                    
                    {/* Reviews List */}
                    <div className="space-y-6">
                      {ratings.map((rating) => (
                        <div key={rating.id} className="pb-4 border-b border-gray-200">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 mr-2">
                              {rating.user?.profileImage && (
                                <Image 
                                  src={rating.user.profileImage} 
                                  alt={rating.user.username || 'User'} 
                                  width={32} 
                                  height={32}
                                  className="rounded-full object-cover w-full h-full"
                                />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-black">
                                {rating.user?.username || 'Anonymous'}
                              </div>
                              <div className="text-xs text-gray-500 text-black">
                                {formatDate(rating.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex text-yellow-400 mb-2">
                            {renderStars(rating.stars)}
                          </div>
                          {rating.comment && (
                            <div className="text-sm text-black">{rating.comment}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Show More Button */}
                    {ratings.length > 3 && (
                      <div className="mt-6 text-center">
                        <button className={`${cartoonStyle.button} py-2 px-4 text-black`}>
                          Show More Reviews
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Product Images Gallery */}
            {product?.images && product.images.length > 1 && (
              <div className={`${cartoonStyle.card} mt-6 bg-white p-4`}>
                <h2 className={`${cartoonStyle.heading} text-black mb-4`}>Product Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t-2 border-black pt-4">
                  {product.images.map((image: string, index: number) => (
                    <div key={index} className="aspect-square relative overflow-hidden rounded-md border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Image
                        src={getImagePath(image)}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 