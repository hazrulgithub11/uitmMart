"use client"

import { useState } from 'react'
import { Home, Search, Bell, User, ShoppingCart, Minus, Plus, Trash2, Store, Check, MessageCircle } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const router = useRouter()
  
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Search', url: '/search', icon: Search },
    { name: 'Notifications', url: '/notifications', icon: Bell },
    { name: 'Profile', url: '/profile', icon: User }
  ]
  
  // Dummy cart data
  const initialCartItems = [
    {
      id: 1,
      shop: {
        name: 'highclubsgclok8.my',
        logo: '/images/logo2.png'
      },
      product: {
        id: 101,
        title: 'Jacket Mmxxiv JACKET HIGH CL UB Bordeaux red - UNISEX',
        image: '/images/placeholder.svg',
        price: 134.75,
        variation: 'Red BORDEAUX,M',
        quantity: 1,
        stock: 9
      }
    },
    {
      id: 2,
      shop: {
        name: 'wrplncojr.my',
        logo: '/images/logo2.png'
      },
      product: {
        id: 102,
        title: 'Satisfyingfaction Hoodie Zipper Premium',
        image: '/images/placeholder.svg',
        price: 123.75,
        variation: 'Black,XL',
        quantity: 2,
        stock: 15
      }
    }
  ]
  
  // State for cart items and selected items
  const [cartItems] = useState(initialCartItems)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedShops, setSelectedShops] = useState<string[]>([])
  
  // Calculate total price for an item
  const calculateTotal = (price: number, quantity: number): string => {
    return (price * quantity).toFixed(2)
  }
  
  // Check if all products from a shop are selected
  const areAllShopItemsSelected = (shopName: string): boolean => {
    const shopItems = cartItems.filter(item => item.shop.name === shopName)
    const selectedShopItems = shopItems.filter(item => selectedItems.includes(item.id))
    return shopItems.length === selectedShopItems.length && shopItems.length > 0
  }
  
  // Toggle shop selection
  const toggleShopSelection = (shopName: string) => {
    // Get all items from this shop
    const shopItemIds = cartItems
      .filter(item => item.shop.name === shopName)
      .map(item => item.id)
    
    if (areAllShopItemsSelected(shopName)) {
      // If all items are selected, unselect them
      setSelectedItems(prev => prev.filter(id => !shopItemIds.includes(id)))
      setSelectedShops(prev => prev.filter(shop => shop !== shopName))
    } else {
      // If not all items are selected, select them all
      const newSelectedItems = [...selectedItems]
      shopItemIds.forEach(id => {
        if (!newSelectedItems.includes(id)) {
          newSelectedItems.push(id)
        }
      })
      setSelectedItems(newSelectedItems)
      
      if (!selectedShops.includes(shopName)) {
        setSelectedShops([...selectedShops, shopName])
      }
    }
  }
  
  // Toggle individual item selection
  const toggleItemSelection = (itemId: number, shopName: string) => {
    const newSelectedItems = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId]
    
    setSelectedItems(newSelectedItems)
    
    // Check if all items from this shop are now selected
    const shopItems = cartItems.filter(item => item.shop.name === shopName)
    const selectedShopItems = shopItems.filter(item => 
      newSelectedItems.includes(item.id)
    )
    
    // Update shop selection based on product selections
    if (shopItems.length === selectedShopItems.length) {
      if (!selectedShops.includes(shopName)) {
        setSelectedShops([...selectedShops, shopName])
      }
    } else {
      setSelectedShops(prev => prev.filter(shop => shop !== shopName))
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
      const allShopNames = Array.from(new Set(cartItems.map(item => item.shop.name)))
      
      setSelectedItems(allItemIds)
      setSelectedShops(allShopNames)
    }
  }
  
  // Calculate cart total
  const calculateCartTotal = (): string => {
    let total = 0
    selectedItems.forEach(itemId => {
      const item = cartItems.find(item => item.id === itemId)
      if (item) {
        total += item.product.price * item.product.quantity
      }
    })
    return total.toFixed(2)
  }

  // Handle checkout
  const handleCheckout = () => {
    if (selectedItems.length > 0) {
      router.push('/checkout')
    }
  }

  // Navigate to chat page
  const navigateToChat = (shopName: string) => {
    router.push(`/chat?shop=${encodeURIComponent(shopName)}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
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
              className="rounded-full"
            />
          </div>
          
          {/* Search bar in the middle */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full py-2 pl-10 pr-4 rounded-full border border-zinc-700 bg-black text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          
          {/* Cart icon on the right */}
          <div className="flex-shrink-0">
            <button className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ShoppingCart className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Cart Page Content */}
        <div className="text-white">
          <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
          
          {/* Cart Header */}
          <div className="hidden md:grid md:grid-cols-12 bg-zinc-900 p-4 rounded-t-xl text-zinc-400 font-medium mb-1">
            <div className="col-span-5">Product</div>
            <div className="col-span-2 text-center">Unit Price</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-center">Total Price</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>
          
          {/* Cart Items */}
          <div className="bg-zinc-900 rounded-xl md:rounded-t-none overflow-hidden">
            {/* Group cart items by shop */}
            {Array.from(new Set(cartItems.map(item => item.shop.name))).map(shopName => {
              const shopItems = cartItems.filter(item => item.shop.name === shopName)
              const isShopSelected = areAllShopItemsSelected(shopName)
              
              return (
                <div key={shopName} className="border-b border-zinc-800 last:border-b-0">
                  {/* Shop Header with Checkbox */}
                  <div className="px-4 py-2 bg-zinc-800/50 flex items-center gap-2">
                    <button 
                      onClick={() => toggleShopSelection(shopName)}
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isShopSelected ? 'bg-red-500 border-red-500' : 'border-zinc-600 bg-transparent'
                      }`}
                    >
                      {isShopSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <Store className="h-4 w-4 text-white" />
                    <span className="text-white text-sm">{shopName}</span>
                    
                    {/* Chat Button */}
                    <button 
                      onClick={() => navigateToChat(shopName)}
                      className="ml-2 text-green-500 hover:text-green-400 transition-colors flex items-center text-xs"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Shop's Products */}
                  {shopItems.map(item => {
                    const isSelected = selectedItems.includes(item.id)
                    
                    return (
                      <div key={item.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Product Checkbox and Info */}
                        <div className="md:col-span-5 flex gap-3">
                          <button 
                            onClick={() => toggleItemSelection(item.id, shopName)}
                            className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
                              isSelected ? 'bg-red-500 border-red-500' : 'border-zinc-600 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                          
                          <div className="w-20 h-20 bg-zinc-800 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={item.product.image}
                              alt={item.product.title}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-white line-clamp-2">{item.product.title}</h3>
                            <p className="text-xs text-zinc-400 mt-1">Variation: {item.product.variation}</p>
                          </div>
                        </div>
                        
                        {/* Price Info - For Mobile */}
                        <div className="grid grid-cols-3 md:hidden gap-2">
                          <div>
                            <p className="text-xs text-zinc-400">Unit Price</p>
                            <p className="text-white">RM{item.product.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Quantity</p>
                            <div className="flex items-center">
                              <span className="text-white">{item.product.quantity}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Total</p>
                            <p className="text-red-500 font-medium">
                              RM{calculateTotal(item.product.price, item.product.quantity)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Unit Price (Desktop only) */}
                        <div className="hidden md:block md:col-span-2 text-center">
                          <p className="text-white">RM{item.product.price.toFixed(2)}</p>
                        </div>
                        
                        {/* Quantity (Desktop only) */}
                        <div className="hidden md:flex md:col-span-2 justify-center items-center gap-2">
                          <button className="p-1 bg-zinc-800 rounded hover:bg-zinc-700">
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="text"
                            value={item.product.quantity}
                            readOnly
                            className="w-10 bg-black border border-zinc-700 text-center py-1 text-white"
                          />
                          <button className="p-1 bg-zinc-800 rounded hover:bg-zinc-700">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Total Price (Desktop only) */}
                        <div className="hidden md:block md:col-span-2 text-center text-red-500 font-medium">
                          RM{calculateTotal(item.product.price, item.product.quantity)}
                        </div>
                        
                        {/* Actions */}
                        <div className="md:col-span-1 flex md:justify-center">
                          <button className="p-2 text-zinc-400 hover:text-red-500">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          
          {/* Cart Summary and Actions */}
          <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
            <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Select All */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      areAllItemsSelected ? 'bg-red-500 border-red-500' : 'border-zinc-600 bg-transparent'
                    }`}
                  >
                    {areAllItemsSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="text-white text-sm">Select All ({cartItems.length})</span>
                </div>
                
                {/* Delete Button */}
                <button className="text-zinc-400 hover:text-red-500 text-sm">
                  Delete
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Cart Total */}
                <div className="text-right">
                  <div className="text-white text-sm">
                    Total ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}): 
                    <span className="text-red-500 text-lg font-bold ml-2">
                      RM{calculateCartTotal()}
                    </span>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <button 
                  onClick={handleCheckout}
                  className={`px-6 py-2 rounded-md font-medium ${
                    selectedItems.length > 0 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-zinc-600 text-zinc-300 cursor-not-allowed'
                  }`}
                  disabled={selectedItems.length === 0}
                >
                  Check Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 