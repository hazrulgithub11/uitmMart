"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Home, User, ShoppingCart, MapPin, X, Store, MessageCircle, Star, Search } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { Product as ProductType } from '@/hooks/useProducts'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Define a type for products with discount fields
type ProductWithDiscount = {
  discountPercentage?: number | null;
  discountStartDate?: string | Date | null;
  discountEndDate?: string | Date | null;
  [key: string]: unknown;
};

// Check if a discount is currently active
const isDiscountActive = (product: ProductWithDiscount) => {
  if (!product.discountPercentage) return false;
  
  const now = new Date();
  const startDate = product.discountStartDate ? new Date(product.discountStartDate) : null;
  const endDate = product.discountEndDate ? new Date(product.discountEndDate) : null;
  
  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  
  return true;
};

// Define an interface for address data
interface AddressData {
  id: number
  recipientName: string
  phoneNumber: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  latitude?: number
  longitude?: number
}

// Define an interface for checkout items
interface CheckoutItem {
  id: number
  productId: number
  quantity: number
  variation?: string
  product: {
    price: number | string
    name: string
    images?: string[]
    discountPercentage?: number | null
    discountedPrice?: number | string | null
    discountStartDate?: string | Date | null
    discountEndDate?: string | Date | null
    shop: {
      id: number
      name: string
    }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { status } = useSession()
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Offers', url: '/offers', icon: Star },
    { name: 'Mall', url: '/mall', icon: Store },
    { name: 'Profile', url: '/profile', icon: User }
  ]
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useOnClickOutside(searchRef, () => setShowSuggestions(false));
  
  // State for addresses
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [addressError, setAddressError] = useState<string | null>(null)
  
  // State for checkout products
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  
  // States for modals and selections
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [tempSelectedAddressId, setTempSelectedAddressId] = useState<number | null>(null)
  
  
  // States for placing order
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Function to fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true)
      setAddressError(null)
      
      const response = await fetch('/api/addresses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch addresses')
      }
      
      const data = await response.json()
      setAddresses(data)
      
      // Set the default address as selected, or the first address if no default
      const defaultAddress = data.find((addr: AddressData) => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
        setTempSelectedAddressId(defaultAddress.id)
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id)
        setTempSelectedAddressId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setAddressError(error instanceof Error ? error.message : 'Failed to load addresses')
    } finally {
      setLoadingAddresses(false)
    }
  }
  
  // Function to fetch checkout items from sessionStorage
  const fetchCheckoutItems = useCallback(() => {
    try {
      setLoadingItems(true)
      
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        const storedItems = sessionStorage.getItem('checkoutItems')
        
        if (storedItems) {
          const parsedItems = JSON.parse(storedItems)
          setCheckoutItems(parsedItems)
        } else {
          // If no items in sessionStorage, redirect back to cart
          router.push('/cart')
          toast.error('No items selected for checkout')
        }
      }
    } catch (error) {
      console.error('Error fetching checkout items:', error)
      toast.error('Failed to load checkout items')
    } finally {
      setLoadingItems(false)
    }
  }, [router])
  
  // Fetch addresses and checkout items when component mounts
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAddresses()
      fetchCheckoutItems()
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout')
    }
  }, [status, router, fetchCheckoutItems])
  
  // Calculate total price for items
  const calculateSubtotal = () => {
    return checkoutItems.reduce((sum, item) => {
      // Check if discount is active before using discounted price
      const hasActiveDiscount = item.product.discountPercentage && isDiscountActive(item.product);
      
      const price = hasActiveDiscount
        ? (typeof item.product.discountedPrice === 'number'
            ? item.product.discountedPrice
            : parseFloat(String(item.product.discountedPrice)))
        : (typeof item.product.price === 'number' 
            ? item.product.price 
            : parseFloat(String(item.product.price)))
      
      return sum + (price * item.quantity)
    }, 0).toFixed(2)
  }
  
  // Calculate shipping fee (simplified for demo)
  const shippingFee = 10.00
  
  // Calculate total price
  const calculateTotal = () => {
    const subtotal = parseFloat(calculateSubtotal())
    return (subtotal + shippingFee).toFixed(2)
  }
  
  // Get the current selected address
  const selectedAddress = selectedAddressId 
    ? addresses.find(addr => addr.id === selectedAddressId) 
    : null
  
  // Format address for display
  const formatAddressLine = (address: AddressData | null) => {
    if (!address) return []
    
    const lines = []
    lines.push(address.addressLine1)
    if (address.addressLine2) lines.push(address.addressLine2)
    lines.push(`${address.city}, ${address.state}, ${address.postalCode}`)
    lines.push(address.country)
    
    return lines
  }
  
  // Toggle address modal
  const toggleAddressModal = () => {
    setShowAddressModal(!showAddressModal)
    // Reset temp selection to current selection when opening
    if (!showAddressModal && selectedAddressId) {
      setTempSelectedAddressId(selectedAddressId)
    }
  }
  
  // Confirm address selection
  const confirmAddressSelection = () => {
    if (tempSelectedAddressId) {
    setSelectedAddressId(tempSelectedAddressId)
    }
    setShowAddressModal(false)
  }
  
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
  
  // Navigate to chat page
  const navigateToChat = (shopId: number) => {
    router.push(`/chat?shop=${encodeURIComponent(shopId.toString())}`)
  }

  // Navigate to shop page
  const navigateToShop = (shopId: number) => {
    router.push(`/shop/${shopId}`)
  }
  
  // Navigate to add new address page
  const navigateToAddAddress = () => {
    router.push('/profile/addresses')
  }

  // Handle placing order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create checkout session with Stripe
      const response = await fetch('/api/checkout/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: checkoutItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            variation: item.variation
          })),
          addressId: selectedAddress.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred during checkout');
      setIsSubmitting(false);
    }
  }

  // Loading state for addresses or items
  if (loadingAddresses || loadingItems) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
        <div className="pt-32 px-4 mx-auto max-w-4xl">
          <div className={`${cartoonStyle.card} mb-6`}>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
              <p className="text-black font-bold">Loading checkout information...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no checkout items, show error
  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center">
        <NavBar items={navItems} />
        <div className="pt-32 px-4 mx-auto max-w-4xl">
          <div className={`${cartoonStyle.card} mb-6`}>
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No items selected for checkout</h3>
              <p className="text-gray-600 mb-6">Go back to your cart and select items for checkout.</p>
              <button 
                onClick={() => router.push('/cart')}
                className={`${cartoonStyle.buttonPrimary} px-6 py-2 font-medium`}
              >
                Return to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-repeat bg-auto pb-20">
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
                      {product.discountPercentage && isDiscountActive(product as unknown as ProductWithDiscount) ? (
                        <div>
                          <span className="text-gray-500 line-through text-xs">
                            RM {typeof product.price === 'number' 
                              ? product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : parseFloat(String(product.price)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            }
                          </span>
                          <div className="text-red-500">
                            RM {typeof product.discountedPrice === 'number' 
                              ? product.discountedPrice.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : parseFloat(String(product.discountedPrice)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            }
                          </div>
                        </div>
                      ) : (
                        <div>
                          RM {typeof product.price === 'number' 
                            ? product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : parseFloat(String(product.price)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Cart icon on the right */}
          <div className="flex-shrink-0">
            <Link href="/cart">
              <button className={`${cartoonStyle.button} p-2 rounded-full text-black`}>
                <ShoppingCart className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Checkout Page Content */}
        <div className="text-black">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          
          {/* Delivery Address Section */}
          <div className={`${cartoonStyle.card} mb-6 bg-blue-50`}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-red-500" size={20} />
              <h2 className="text-lg font-medium text-black">Delivery Address</h2>
            </div>
            
            {addressError ? (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-700">Error loading addresses: {addressError}</p>
                <button 
                  onClick={fetchAddresses}
                  className={`${cartoonStyle.buttonPrimary} mt-2 px-4 py-1 text-sm`}
                >
                  Try Again
                </button>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
                <p className="text-yellow-700">You don&apos;t have any saved addresses.</p>
                <button 
                  onClick={navigateToAddAddress}
                  className={`${cartoonStyle.buttonPrimary} mt-2 px-4 py-1 text-sm`}
                >
                  Add Address
                </button>
              </div>
            ) : selectedAddress ? (
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedAddress.recipientName}</p>
                    <p className="text-gray-600">({selectedAddress.phoneNumber})</p>
                </div>
                  {formatAddressLine(selectedAddress).map((line, index) => (
                    <p key={index} className="text-gray-700">{line}</p>
                  ))}
              </div>
              
              <div className="flex items-center gap-3">
                  {selectedAddress.isDefault && (
                    <span className="text-xs border-2 border-red-500 text-red-500 px-2 py-1 rounded bg-white">
                    Default
                  </span>
                )}
                  <button 
                    className={`${cartoonStyle.buttonPrimary} px-3 py-1 text-sm`}
                    onClick={toggleAddressModal}
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
                <p className="text-yellow-700">Please select a delivery address.</p>
                <button 
                  onClick={toggleAddressModal}
                  className={`${cartoonStyle.buttonPrimary} mt-2 px-4 py-1 text-sm`}
                >
                  Select Address
                </button>
              </div>
            )}
          </div>
          
          {/* Products Ordered Section */}
          <div className={`${cartoonStyle.card} mb-6 overflow-hidden`}>
            <div className="pb-3">
              <h2 className="text-lg font-medium text-black mb-2">Products Ordered</h2>
            </div>
            
            {/* Table headers */}
            <div className="hidden md:grid grid-cols-12 py-3 px-6 border-b-3 border-black text-gray-700 text-sm bg-gray-100">
              <div className="col-span-6">Products Ordered</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-center">Amount</div>
              <div className="col-span-2 text-right">Item Subtotal</div>
            </div>
            
            {/* Products List */}
            <div className="divide-y-3 divide-black">
              {checkoutItems.map((item) => {
                // Get product image
                const productImage = item.product.images && item.product.images.length > 0 
                  ? item.product.images[0] 
                  : "/images/placeholder.svg"
                  
                return (
                  <div key={item.id} className="p-6">
                  {/* Shop name with chat button */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center">
                        <Store className="h-4 w-4 text-blue-600 mr-2" />
                        <span 
                          className="text-black text-sm font-bold cursor-pointer hover:text-blue-600"
                          onClick={() => navigateToShop(item.product.shop.id)}
                        >
                          {item.product.shop.name}
                        </span>
                    </div>
                    <button 
                        onClick={() => navigateToChat(item.product.shop.id)}
                        className="text-green-600 hover:text-green-400 transition-colors flex items-center text-xs"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      chat now
                    </button>
                  </div>
                  
                  {/* Product details */}
                  <div className="md:grid grid-cols-12 gap-4 items-center">
                    {/* Product info */}
                    <div className="col-span-6 flex gap-3 mb-4 md:mb-0">
                        <div 
                          className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                          onClick={() => router.push(`/product/${item.productId}`)}
                        >
                        <Image 
                            src={productImage}
                            alt={item.product.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                          <p 
                            className="text-black text-sm cursor-pointer hover:text-blue-600"
                            onClick={() => router.push(`/product/${item.productId}`)}
                          >
                            {item.product.name}
                          </p>
                          {item.variation && (
                            <p className="text-gray-600 text-xs mt-1">Variation: {item.variation}</p>
                          )}
                      </div>
                    </div>
                    
                    {/* Pricing */}
                    <div className="col-span-2 text-right">
                        <div className="md:hidden text-gray-600 text-xs mb-1">Unit Price</div>
                        {item.product.discountPercentage && isDiscountActive(item.product) ? (
                          <>
                            <p className="text-gray-500 line-through text-xs">
                              RM{typeof item.product.price === 'number' 
                                ? item.product.price.toFixed(2) 
                                : parseFloat(String(item.product.price)).toFixed(2)}
                            </p>
                            <p className="text-black">
                              RM{typeof item.product.discountedPrice === 'number' 
                                ? item.product.discountedPrice.toFixed(2) 
                                : parseFloat(String(item.product.discountedPrice)).toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-black">
                            RM{typeof item.product.price === 'number' 
                              ? item.product.price.toFixed(2) 
                              : parseFloat(String(item.product.price)).toFixed(2)}
                          </p>
                        )}
                    </div>
                    
                    <div className="col-span-2 text-center">
                        <div className="md:hidden text-gray-600 text-xs mb-1">Amount</div>
                        <p className="text-black">{item.quantity}</p>
                    </div>
                    
                    <div className="col-span-2 text-right">
                        <div className="md:hidden text-gray-600 text-xs mb-1">Item Subtotal</div>
                        <p className="text-red-500 font-bold">
                          RM{item.product.discountPercentage && isDiscountActive(item.product)
                            ? (parseFloat(String(item.product.discountedPrice)) * item.quantity).toFixed(2)
                            : (parseFloat(String(item.product.price)) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Order Summary Section */}
          <div className={`${cartoonStyle.card} mb-6 bg-yellow-50`}>
            <h2 className="text-lg font-medium text-black mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Merchandise Subtotal</span>
                <span className="text-black">RM{calculateSubtotal()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Shipping Fee</span>
                <span className="text-black">RM{shippingFee.toFixed(2)}</span>
              </div>
              
              <div className="pt-3 border-t-3 border-black flex justify-between">
                <span className="text-black font-bold">Total</span>
                <span className="text-xl font-bold text-red-500">
                  RM{calculateTotal()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Place Order Button */}
          <div className="mb-20">
            <button 
              className={`${cartoonStyle.buttonDanger} w-full py-3 text-white font-bold ${!selectedAddress || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!selectedAddress || isSubmitting}
              onClick={handlePlaceOrder}
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
            {!selectedAddress && (
              <p className="text-red-500 text-center mt-2">Please select a delivery address to proceed</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Address Selection Modal */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" style={{ display: showAddressModal ? 'flex' : 'none' }}>
        <div className={`bg-white rounded-xl w-full max-w-md overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
            {/* Modal Header */}
          <div className="bg-blue-100 p-4 border-b-3 border-black flex justify-between items-center">
            <h3 className="text-lg font-bold text-black">My Address</h3>
              <button 
                onClick={toggleAddressModal}
              className="text-black hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Address List */}
            <div className="max-h-[60vh] overflow-y-auto">
            {addresses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-4">You don&apos;t have any saved addresses.</p>
                <button 
                  onClick={navigateToAddAddress}
                  className={`${cartoonStyle.buttonPrimary} px-4 py-2`}
                >
                  Add New Address
                </button>
              </div>
            ) : (
              addresses.map((address) => (
                <div 
                  key={address.id} 
                  className="border-b-3 border-black p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Radio Button */}
                    <div className="mt-1">
                      <button 
                        className={`w-5 h-5 rounded-full border-3 flex-shrink-0 ${
                          tempSelectedAddressId === address.id 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-black bg-white'
                        }`}
                        onClick={() => setTempSelectedAddressId(address.id)}
                      ></button>
                    </div>
                    
                    {/* Address Info */}
                    <div className="flex-grow">
                      <div className="flex justify-between w-full">
                        <p className="font-bold text-black">{address.recipientName}</p>
                        <button 
                          className="text-blue-500 text-sm font-bold"
                          onClick={() => navigateToAddAddress()}
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{address.phoneNumber}</p>
                      {formatAddressLine(address).map((line, index) => (
                        <p key={index} className="text-black text-sm">{line}</p>
                      ))}
                      
                      {/* Tags */}
                      <div className="mt-2">
                        {address.isDefault && (
                          <span className="inline-block text-xs border-2 border-red-500 text-red-500 px-2 py-0.5 rounded mr-2 bg-white">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
            
            {/* Action Buttons */}
          <div className="p-4 flex gap-3 border-t-3 border-black">
              <button 
                onClick={toggleAddressModal}
              className={`${cartoonStyle.button} flex-1 py-2 px-4 text-black`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmAddressSelection}
              className={`${cartoonStyle.buttonDanger} flex-1 py-2 px-4 text-white ${!tempSelectedAddressId ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!tempSelectedAddressId}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
    </div>
  )
} 