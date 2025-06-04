"use client"

import { useState, useEffect } from 'react'
import { Home, Search, Bell, User, ShoppingCart, Minus, Plus, Trash2, Store, Check, MessageCircle, Loader2 } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Define interfaces for the cart data
interface Product {
  id: number;
  name: string;
  price: number | string | unknown; // Handle different possible price types
  stock: number;
  status: string;
  images: string[];
  shop: Shop;
}

interface Shop {
  id: number;
  name: string;
  logoUrl: string | null;
  seller?: {
    id: number;
    fullName: string;
    email: string;
  }
}

interface CartItem {
  id: number;
  productId: number;
  userId: number;
  quantity: number;
  variation: string | null;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export default function CartPage() {
  const router = useRouter()
  const { status } = useSession()
  
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Search', url: '/search', icon: Search },
    { name: 'Notifications', url: '/notifications', icon: Bell },
    { name: 'Profile', url: '/profile', icon: User }
  ]
  
  // States for cart data and UI
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedShops, setSelectedShops] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingItems, setProcessingItems] = useState<number[]>([])
  
  // Fetch cart data when the component mounts
  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/cart')
      return
    }
    
    if (status === 'authenticated') {
      fetchCartData()
      }
  }, [status, router])
  
  // Function to fetch cart data from the API
  const fetchCartData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/cart')
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart items')
      }
      
      const data = await response.json()
      setCartItems(data.cartItems || [])
    } catch (err) {
      console.error('Error fetching cart data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching cart items')
      toast.error('Failed to load cart items')
    } finally {
      setIsLoading(false)
    }
  }
  
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
  
  // Calculate total price for an item
  const calculateTotal = (price: unknown, quantity: number): string => {
    const numericPrice = safeParseFloat(price);
    return (numericPrice * quantity).toFixed(2);
  }
  
  // Get image URL with fallback
  const getImageUrl = (images: string[] | undefined): string => {
    if (!images || images.length === 0) {
      return '/images/placeholder.svg'
    }
    return images[0]
  }
  
  // Group cart items by shop
  const getShopGroups = () => {
    const shopMap = new Map<number, CartItem[]>()
    
    cartItems.forEach(item => {
      const shopId = item.product.shop.id
      if (!shopMap.has(shopId)) {
        shopMap.set(shopId, [])
      }
      shopMap.get(shopId)?.push(item)
    })
    
    return Array.from(shopMap.entries()).map(([shopId, items]) => ({
      shopId,
      shopName: items[0].product.shop.name,
      items
    }))
  }
  
  // Check if all products from a shop are selected
  const areAllShopItemsSelected = (shopId: number): boolean => {
    const shopItems = cartItems.filter(item => item.product.shop.id === shopId)
    const selectedShopItems = shopItems.filter(item => selectedItems.includes(item.id))
    return shopItems.length === selectedShopItems.length && shopItems.length > 0
  }
  
  // Toggle shop selection
  const toggleShopSelection = (shopId: number) => {
    // Get all items from this shop
    const shopItemIds = cartItems
      .filter(item => item.product.shop.id === shopId)
      .map(item => item.id)
    
    if (areAllShopItemsSelected(shopId)) {
      // If all items are selected, unselect them
      setSelectedItems(prev => prev.filter(id => !shopItemIds.includes(id)))
      setSelectedShops(prev => prev.filter(id => id !== shopId))
    } else {
      // If not all items are selected, select them all
      const newSelectedItems = [...selectedItems]
      shopItemIds.forEach(id => {
        if (!newSelectedItems.includes(id)) {
          newSelectedItems.push(id)
        }
      })
      setSelectedItems(newSelectedItems)
      
      if (!selectedShops.includes(shopId)) {
        setSelectedShops([...selectedShops, shopId])
      }
    }
  }
  
  // Toggle individual item selection
  const toggleItemSelection = (itemId: number, shopId: number) => {
    const newSelectedItems = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId]
    
    setSelectedItems(newSelectedItems)
    
    // Check if all items from this shop are now selected
    const shopItems = cartItems.filter(item => item.product.shop.id === shopId)
    const selectedShopItems = shopItems.filter(item => 
      newSelectedItems.includes(item.id)
    )
    
    // Update shop selection based on product selections
    if (shopItems.length === selectedShopItems.length) {
      if (!selectedShops.includes(shopId)) {
        setSelectedShops([...selectedShops, shopId])
      }
    } else {
      setSelectedShops(prev => prev.filter(id => id !== shopId))
    }
  }

  // Check if all items are selected
  const areAllItemsSelected = cartItems.length > 0 && selectedItems.length === cartItems.length

  // Toggle select all
  const toggleSelectAll = () => {
    if (areAllItemsSelected) {
      // Deselect all items and shops
      setSelectedItems([])
      setSelectedShops([])
    } else {
      // Select all items and shops
      const allItemIds = cartItems.map(item => item.id)
      const allShopIds = Array.from(new Set(cartItems.map(item => item.product.shop.id)))
      
      setSelectedItems(allItemIds)
      setSelectedShops(allShopIds)
    }
  }
  
  // Update item quantity
  const updateItemQuantity = async (itemId: number, newQuantity: number) => {
    // Don't proceed if the item is already being processed
    if (processingItems.includes(itemId)) return
    
    try {
      setProcessingItems(prev => [...prev, itemId])
      
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quantity')
      }
      
      // Update local cart data
      const updatedData = await response.json()
      setCartItems(prev => 
        prev.map(item => item.id === itemId ? updatedData.cartItem : item)
      )
      
      toast.success('Cart updated')
    } catch (err) {
      console.error('Error updating quantity:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update quantity')
    } finally {
      setProcessingItems(prev => prev.filter(id => id !== itemId))
    }
  }
  
  // Handle quantity increase
  const increaseQuantity = (item: CartItem) => {
    if (item.quantity < item.product.stock) {
      updateItemQuantity(item.id, item.quantity + 1)
    } else {
      toast.error('Maximum available quantity reached')
    }
  }
  
  // Handle quantity decrease
  const decreaseQuantity = (item: CartItem) => {
    if (item.quantity > 1) {
      updateItemQuantity(item.id, item.quantity - 1)
    }
  }
  
  // Delete a single item from the cart
  const deleteCartItem = async (itemId: number) => {
    // Don't proceed if the item is already being processed
    if (processingItems.includes(itemId)) return
    
    try {
      setProcessingItems(prev => [...prev, itemId])
      
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete item')
      }
      
      // Remove the item from local state
      setCartItems(prev => prev.filter(item => item.id !== itemId))
      setSelectedItems(prev => prev.filter(id => id !== itemId))
      
      toast.success('Item removed from cart')
    } catch (err) {
      console.error('Error deleting item:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete item')
    } finally {
      setProcessingItems(prev => prev.filter(id => id !== itemId))
    }
  }
  
  // Delete selected items from the cart
  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return
    
    try {
      // Set all selected items as processing
      setProcessingItems(prev => [...prev, ...selectedItems])
      
      const response = await fetch('/api/cart/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          itemIds: selectedItems,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete items')
      }
      
      // Remove the deleted items from local state
      setCartItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      setSelectedShops([])
      
      toast.success('Selected items removed from cart')
    } catch (err) {
      console.error('Error deleting selected items:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete selected items')
    } finally {
      setProcessingItems([])
    }
  }
  
  // Calculate cart total
  const calculateCartTotal = (): string => {
    let total = 0
    selectedItems.forEach(itemId => {
      const item = cartItems.find(item => item.id === itemId)
      if (item) {
        total += safeParseFloat(item.product.price) * item.quantity;
      }
    })
    return total.toFixed(2)
  }

  // Handle checkout
  const handleCheckout = () => {
    if (selectedItems.length > 0) {
      // Store selected items in local storage or session storage for checkout page
      sessionStorage.setItem('checkoutItems', JSON.stringify(
        cartItems.filter(item => selectedItems.includes(item.id))
      ))
      router.push('/checkout')
    } else {
      toast.error('Please select at least one item to checkout')
    }
  }

  // Navigate to chat page with seller
  const navigateToChat = (shopId: number) => {
    router.push(`/chat?shop=${encodeURIComponent(shopId.toString())}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
          <p className="mt-4 text-black font-bold">Loading your cart...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center flex items-center justify-center">
        <div className={`${cartoonStyle.card} max-w-md w-full`}>
          <h2 className="text-xl font-bold text-red-500 mb-4">Oops! Something went wrong</h2>
          <p className="text-black mb-6">{error}</p>
          <button 
            onClick={fetchCartData}
            className={`${cartoonStyle.buttonPrimary} px-4 py-2 w-full`}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const shopGroups = getShopGroups()

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
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className={`${cartoonStyle.input} w-full py-2 pl-10 pr-4 text-black`}
            />
          </div>
          
          {/* Cart icon on the right */}
          <div className="flex-shrink-0">
            <button className={`${cartoonStyle.button} p-2 rounded-full text-black`}>
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cart Page Content */}
        <div className={`${cartoonStyle.card} mb-20`}>
          <h1 className="text-2xl font-bold mb-6 text-black">Shopping Cart</h1>
          
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6">Looks like you haven&apos;t added any items to your cart yet.</p>
              <button 
                onClick={() => router.push('/main')}
                className={`${cartoonStyle.buttonPrimary} px-6 py-2 font-medium`}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
          {/* Cart Header */}
              <div className="hidden md:grid md:grid-cols-12 bg-gray-100 p-4 rounded-xl text-gray-700 font-medium mb-1 border-3 border-black">
            <div className="col-span-5">Product</div>
            <div className="col-span-2 text-center">Unit Price</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-center">Total Price</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>
          
          {/* Cart Items */}
              <div className="rounded-xl overflow-hidden">
            {/* Group cart items by shop */}
                {shopGroups.map(({ shopId, shopName, items }) => (
                  <div key={shopId} className="border-b-3 border-black last:border-b-0">
                  {/* Shop Header with Checkbox */}
                    <div className="px-4 py-2 bg-blue-100 flex items-center gap-2 border-3 border-black rounded-t-xl mt-4">
                    <button 
                        onClick={() => toggleShopSelection(shopId)}
                        className={`w-5 h-5 rounded border-3 flex items-center justify-center ${
                          areAllShopItemsSelected(shopId) ? 'bg-red-500 border-red-500' : 'border-black bg-white'
                      }`}
                    >
                        {areAllShopItemsSelected(shopId) && <Check className="w-3 h-3 text-white" />}
                    </button>
                      <Store className="h-4 w-4 text-blue-600" />
                      <span 
                        className="text-black text-sm font-bold cursor-pointer hover:text-blue-600"
                        onClick={() => router.push(`/shop/${shopId}`)}
                      >
                        {shopName}
                      </span>
                    
                    {/* Chat Button */}
                    <button 
                        onClick={() => navigateToChat(shopId)}
                        className="ml-2 text-green-600 hover:text-green-400 transition-colors flex items-center text-xs"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Shop's Products */}
                    {items.map(item => {
                    const isSelected = selectedItems.includes(item.id)
                      const isProcessing = processingItems.includes(item.id)
                    
                    return (
                        <div key={item.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-3 border-t-0 border-black bg-white">
                        {/* Product Checkbox and Info */}
                        <div className="md:col-span-5 flex gap-3">
                          <button 
                              onClick={() => toggleItemSelection(item.id, item.product.shop.id)}
                              className={`w-5 h-5 rounded border-3 flex-shrink-0 flex items-center justify-center ${
                                isSelected ? 'bg-red-500 border-red-500' : 'border-black bg-white'
                            }`}
                              disabled={isProcessing}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                          
                            <div 
                              className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                              onClick={() => router.push(`/product/${item.productId}`)}
                            >
                            <Image
                                src={getImageUrl(item.product.images)}
                                alt={item.product.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div>
                              <h3 
                                className="text-sm font-medium text-black line-clamp-2 cursor-pointer hover:text-blue-600"
                                onClick={() => router.push(`/product/${item.productId}`)}
                              >
                                {item.product.name}
                              </h3>
                              {item.variation && (
                                <p className="text-xs text-gray-600 mt-1">Variation: {item.variation}</p>
                              )}
                          </div>
                        </div>
                        
                        {/* Price Info - For Mobile */}
                        <div className="grid grid-cols-3 md:hidden gap-2">
                          <div>
                              <p className="text-xs text-gray-600">Unit Price</p>
                              <p className="text-black">RM{safeParseFloat(item.product.price).toFixed(2)}</p>
                          </div>
                          <div>
                              <p className="text-xs text-gray-600">Quantity</p>
                            <div className="flex items-center">
                                <span className="text-black">{item.quantity}</span>
                            </div>
                          </div>
                          <div>
                              <p className="text-xs text-gray-600">Total</p>
                            <p className="text-red-500 font-medium">
                                RM{calculateTotal(item.product.price, item.quantity)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Unit Price (Desktop only) */}
                        <div className="hidden md:block md:col-span-2 text-center">
                            <p className="text-black">RM{safeParseFloat(item.product.price).toFixed(2)}</p>
                        </div>
                        
                        {/* Quantity (Desktop only) */}
                        <div className="hidden md:flex md:col-span-2 justify-center items-center gap-2">
                            <button 
                              className="p-1 bg-gray-100 border-2 border-black rounded hover:bg-gray-200 disabled:opacity-50"
                              onClick={() => decreaseQuantity(item)}
                              disabled={item.quantity <= 1 || isProcessing}
                            >
                              <Minus className="h-4 w-4 text-black" />
                          </button>
                            <div className="w-10 bg-white border-2 border-black text-center py-1 text-black">
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              ) : (
                                item.quantity
                              )}
                            </div>
                            <button 
                              className="p-1 bg-gray-100 border-2 border-black rounded hover:bg-gray-200 disabled:opacity-50"
                              onClick={() => increaseQuantity(item)}
                              disabled={item.quantity >= item.product.stock || isProcessing}
                            >
                              <Plus className="h-4 w-4 text-black" />
                          </button>
                        </div>
                        
                        {/* Total Price (Desktop only) */}
                        <div className="hidden md:block md:col-span-2 text-center text-red-500 font-medium">
                            RM{calculateTotal(item.product.price, item.quantity)}
                        </div>
                        
                        {/* Actions */}
                        <div className="md:col-span-1 flex md:justify-center">
                            <button 
                              className="p-2 text-gray-600 hover:text-red-500 disabled:opacity-50"
                              onClick={() => deleteCartItem(item.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                            <Trash2 className="h-5 w-5" />
                              )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                ))}
              </div>
            </>
          )}
        </div>
          </div>
          
      {/* Cart Summary and Actions - Only show if cart has items */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)]">
            <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Select All */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded border-3 flex items-center justify-center ${
                    areAllItemsSelected ? 'bg-red-500 border-red-500' : 'border-black bg-white'
                    }`}
                  >
                    {areAllItemsSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                <span className="text-black text-sm">Select All ({cartItems.length})</span>
                </div>
                
                {/* Delete Button */}
              <button 
                className={`text-red-500 hover:text-red-600 text-sm font-bold ${selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={deleteSelectedItems}
                disabled={selectedItems.length === 0}
              >
                  Delete
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Cart Total */}
                <div className="text-right">
                <div className="text-black text-sm">
                    Total ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}): 
                    <span className="text-red-500 text-lg font-bold ml-2">
                      RM{calculateCartTotal()}
                    </span>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <button 
                  onClick={handleCheckout}
                className={selectedItems.length > 0 
                  ? `${cartoonStyle.buttonDanger} px-6 py-2 font-medium` 
                  : 'bg-gray-400 text-white border-3 border-black rounded-lg px-6 py-2 font-medium cursor-not-allowed'
                }
                  disabled={selectedItems.length === 0}
                >
                  Check Out
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  )
} 