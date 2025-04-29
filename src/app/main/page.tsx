"use client"

import { Home, Search, Bell, User, ShoppingCart, BookOpen, PenTool, FileText, Laptop, Usb, 
         Shirt, Footprints, Watch, Scissors, Cookie, Pizza, Coffee, Sofa, Bed, Lamp, 
         GraduationCap, FileCode, Gamepad, Headphones, ChevronRight, ChevronLeft } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import { products } from '@/data/products'


export default function MainPage() {
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Search', url: '/search', icon: Search },
    { name: 'Notifications', url: '/notifications', icon: Bell },
    { name: 'Profile', url: '/profile', icon: User }
  ]

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
        
        {/* Banner Images Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Main banner (spans full width on mobile, 2 columns on desktop) */}
          <div className="md:col-span-2 rounded-xl overflow-hidden shadow-lg">
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
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/research.png"
                alt="Promotion 1"
                width={400}
                height={145}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
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
            <h2 className="text-xl font-semibold text-white">CATEGORIES</h2>
          </div>
          
          {/* First row of categories */}
          <div className="relative mb-6">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('category-row-1')
                  if (container) container.scrollBy({ left: -320, behavior: 'smooth' })
                }}
                className="p-1 bg-zinc-800/80 rounded-full hover:bg-zinc-700"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('category-row-1')
                  if (container) container.scrollBy({ left: 320, behavior: 'smooth' })
                }}
                className="p-1 bg-zinc-800/80 rounded-full hover:bg-zinc-700"
              >
                <ChevronRight className="h-6 w-6 text-white" />
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
                    href="#"
                    className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-zinc-800 rounded-full mb-2">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-center text-xs text-white">{category.name}</span>
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
                className="p-1 bg-zinc-800/80 rounded-full hover:bg-zinc-700"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('category-row-2')
                  if (container) container.scrollBy({ left: 320, behavior: 'smooth' })
                }}
                className="p-1 bg-zinc-800/80 rounded-full hover:bg-zinc-700"
              >
                <ChevronRight className="h-6 w-6 text-white" />
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
                    href="#"
                    className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-zinc-800 rounded-full mb-2">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-center text-xs text-white">{category.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Product Showcase Section */}
        <div className="mb-8">
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">DAILY DISCOVER</h2>
            <div className="w-32 h-0.5 bg-blue-500 relative">
              <div className="absolute inset-0 bg-blue-500 blur-sm"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <a 
                key={product.id} 
                href={`/product/${product.id}`}
                className="block bg-zinc-900 rounded-lg overflow-hidden shadow-md relative hover:shadow-xl transition-shadow"
              >
                {product.discount && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 z-10">
                    -{product.discount}%
                  </div>
                )}
                <div className="w-full h-40 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={200}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm text-white font-medium truncate">{product.title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {product.cod && (
                      <div className="bg-blue-500 text-white text-xs px-2 rounded">COD</div>
                    )}
                  </div>
                  <div className="mt-1 text-white font-semibold">
                    RM {product.price.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </a>
            ))}
          </div>
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
