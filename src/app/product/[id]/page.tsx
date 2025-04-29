"use client"

import { Home, Search, Bell, User, ShoppingCart, Minus, Plus, MessageSquare, Store } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { getProductById } from '@/data/products'
import { useEffect, useState } from 'react'
import { Product } from '@/data/products'

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)
  
  useEffect(() => {
    if (productId) {
      const foundProduct = getProductById(productId)
      setProduct(foundProduct || null)
    }
  }, [productId])

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Search', url: '/search', icon: Search },
    { name: 'Notifications', url: '/notifications', icon: Bell },
    { name: 'Profile', url: '/profile', icon: User }
  ]

  // Stock is hardcoded for demo
  const stockAvailable = 1908

  // Mock shop data
  const shopInfo = {
    name: "wrplncojr.my",
    logo: "/images/logo2.png", // Using existing logo as placeholder
    active: "5 Minutes Ago",
    products: 170,
    joined: "8 months ago"
  }
  
  // Mock product specifications
  const productSpecs = {
    stock: 159,
    shipsFrom: "Terengganu"
  }
  
  // Mock product description (placeholder text)
  const productDescription = `**READ BEFORE PLACE ORDER**
- Please note that this is a digital file, no physical product will be shipped.
- Link will be send via Shopee Chat.

WHAT WILL YOU GET:
- Film Japan preset (1 preset ONLY)

PRESET FORMAT
- .dng format

COMPATIBLE TO
- Lightroom Mobile (Android & iOS)

*Installation instructions will be provided.
Transform your pics with a single click - from 'meh' to 'whoa' in a snap! ✨

Notes:
- The preset works differently on every photo depending on your camera, lighting condition, camera setting, etc. Therefore, sometimes it's normal to make some adjustments after applying preset to achieve your desired result!`;

  return (
    <div className="min-h-screen bg-zinc-950">
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

        {/* Product Detail Content */}
        {product === undefined ? (
          <div className="text-white text-center py-8">Loading...</div>
        ) : product === null ? (
          <div className="text-white text-center py-8">Product not found</div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Product Image */}
              <div className="bg-zinc-900 rounded-xl overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.title}
                  width={500}
                  height={500}
                  className="w-full h-auto object-contain"
                />
              </div>
              
              {/* Product Details */}
              <div className="text-white">
                {/* Title */}
                <h1 className="text-2xl font-bold mb-4">{product.title}</h1>
                
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-red-500">
                      RM{product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    
                    {product.discount && (
                      <span className="text-lg text-zinc-400 line-through">
                        RM{((product.price * 100) / (100 - product.discount)).toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {product.discount && (
                    <div className="mt-1">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {product.discount}% OFF
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Stock Status */}
                <div className="mb-6">
                  <p className="text-zinc-400">
                    {stockAvailable} pieces available
                  </p>
                </div>
                
                {/* Quantity Selector */}
                <div className="mb-6">
                  <p className="text-zinc-400 mb-2">Quantity</p>
                  <div className="flex items-center">
                    <button 
                      onClick={decreaseQuantity} 
                      className="bg-zinc-800 p-2 rounded-l-md hover:bg-zinc-700"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      className="bg-black border-t border-b border-zinc-700 w-16 text-center py-2"
                    />
                    
                    <button 
                      onClick={increaseQuantity} 
                      className="bg-zinc-800 p-2 rounded-r-md hover:bg-zinc-700"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button className="flex-1 border border-red-500 text-red-500 font-medium py-3 rounded-md hover:bg-red-500/10 transition-colors">
                    Add To Cart
                  </button>
                  <button className="flex-1 bg-red-500 text-white font-medium py-3 rounded-md hover:bg-red-600 transition-colors">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
            
            {/* Shop Information Section */}
            <div className="bg-zinc-900 rounded-xl p-4 mt-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 mb-4 sm:mb-0">
                  <Image 
                    src={shopInfo.logo}
                    alt={shopInfo.name}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-zinc-700"
                  />
                  <div>
                    <h3 className="text-white font-medium">{shopInfo.name}</h3>
                    <p className="text-zinc-400 text-sm">Active {shopInfo.active}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
                    <MessageSquare size={16} />
                    <span>Chat Now</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 border border-zinc-600 text-white px-4 py-2 rounded hover:bg-zinc-800 transition-colors">
                    <Store size={16} />
                    <span>View Shop</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 mt-4 text-sm">
                <div className="py-2">
                  <p className="text-zinc-400">Products</p>
                  <p className="text-white">{shopInfo.products}</p>
                </div>
                <div className="py-2">
                  <p className="text-zinc-400">Joined</p>
                  <p className="text-white">{shopInfo.joined}</p>
                </div>
              </div>
            </div>
            
            {/* Product Specifications Section */}
            <div className="mt-6 mb-6 bg-zinc-900 rounded-xl p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Product Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex">
                  <div className="w-32 text-zinc-400">Stock</div>
                  <div className="text-white">{productSpecs.stock}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-zinc-400">Ships From</div>
                  <div className="text-white">{productSpecs.shipsFrom}</div>
                </div>
              </div>
            </div>
            
            {/* Product Description Section */}
            <div className="mt-6 bg-zinc-900 rounded-xl p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Product Description</h2>
              <div className="text-white whitespace-pre-line">
                {productDescription}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 