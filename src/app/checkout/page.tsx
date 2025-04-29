"use client"

import { useState } from 'react'
import { Home, Search, Bell, User, ShoppingCart, MapPin, X, AlertCircle, ChevronDown, Store, MessageCircle } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Define an interface for address data
interface AddressData {
  id: number
  name: string
  phone: string
  state: string
  area: string
  district: string
  postalCode: string
  unit: string
  addressLine: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  isDefault?: boolean
  isPickupAddress?: boolean
  needsUpdate?: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Search', url: '/search', icon: Search },
    { name: 'Notifications', url: '/notifications', icon: Bell },
    { name: 'Profile', url: '/profile', icon: User }
  ]
  
  // Mock user addresses data
  const userAddresses = [
    {
      id: 1,
      name: "HAZRUL FAHMI",
      phone: "(+60) 11 6936 3271",
      state: "Melaka",
      area: "Jasin",
      district: "Semujok",
      postalCode: "77300",
      unit: "",
      addressLine: "Lot 2554-1, Kampung Seri Mendapat, Semujuk,7300 Merlimau, Melaka",
      addressLine1: "Lot 2554-1, Kampung Seri Mendapat, Semujuk,7300",
      addressLine2: "Merlimau, Melaka",
      addressLine3: "Jasin, Melaka, 77300",
      isDefault: true
    },
    {
      id: 2,
      name: "Muhammad Hazrul Fahmi Bin ...",
      phone: "(+60) 11 6936 3271",
      state: "Johor",
      area: "Batu Pahat",
      district: "Semerah",
      postalCode: "83600",
      unit: "",
      addressLine: "POS 244,KAMPUNG SARANG BUAYA DARAT",
      addressLine1: "POS 244,KAMPUNG SARANG BUAYA DARAT,83600",
      addressLine2: "SEMERAH,BATU PAHAT,JOHOR.",
      addressLine3: "Batu Pahat, Johor, 83600",
      isPickupAddress: true,
      needsUpdate: true
    },
    {
      id: 3,
      name: "MUHAMMAD HAZRUL FAHMI",
      phone: "(+60) 11 6936 3271",
      state: "W.P. Putrajaya",
      area: "Putrajaya",
      district: "Presint 11",
      postalCode: "62300",
      unit: "C-6-15",
      addressLine: "Apartment Prima, Jalan P11e/5, Presint 11",
      addressLine1: "C-6-15 , Apartment Prima, Jalan P11e/5, Presint 11, 62300,",
      addressLine2: "Putrajaya",
      addressLine3: "W.P. Putrajaya, W.P. Putrajaya, 62300"
    }
  ]
  
  // Mock product data
  const orderedProducts = [
    {
      id: 1,
      name: "Jacket Mmxxiv JACKET HIGH CLUB Bordeaux red",
      shopName: "highclubsgclok8.my",
      price: 134.75,
      quantity: 1,
      variation: "Red BORDEAUX,M",
      image: "/images/jacket-bordeaux.jpg"
    },
    {
      id: 2,
      shopName: "teknomobile.my",
      name: "Samsung Galaxy S23 Ultra 12GB+256GB",
      price: 4599.00,
      quantity: 1,
      variation: "Cream",
      image: "/images/placeholder.png"
    }
  ]
  
  // States for modals and selections
  const [selectedAddressId, setSelectedAddressId] = useState(1)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [tempSelectedAddressId, setTempSelectedAddressId] = useState(1)
  const [addressToEdit, setAddressToEdit] = useState<AddressData | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    state: "",
    postalCode: "",
    unit: "",
    addressLine: ""
  })
  
  // Get the current selected address
  const selectedAddress = userAddresses.find(addr => addr.id === selectedAddressId)
  
  // Toggle address modal
  const toggleAddressModal = () => {
    setShowAddressModal(!showAddressModal)
    // Reset temp selection to current selection when opening
    if (!showAddressModal) {
      setTempSelectedAddressId(selectedAddressId)
    }
  }
  
  // Confirm address selection
  const confirmAddressSelection = () => {
    setSelectedAddressId(tempSelectedAddressId)
    setShowAddressModal(false)
  }
  
  // Open edit address modal
  const openEditModal = (address: AddressData) => {
    setAddressToEdit(address)
    setEditFormData({
      name: address.name,
      phone: address.phone,
      state: `${address.state}, ${address.area}, ${address.district}`,
      postalCode: address.postalCode,
      unit: address.unit || "",
      addressLine: address.addressLine
    })
    setShowEditModal(true)
  }
  
  // Close edit address modal
  const closeEditModal = () => {
    setShowEditModal(false)
    setAddressToEdit(null)
  }
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData({
      ...editFormData,
      [name]: value
    })
  }
  
  // Handle form submission
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would save the changes to the database
    // For this demo, we'll just close the modal
    closeEditModal()
  }

  // Navigate to chat page
  const navigateToChat = (shopName: string) => {
    router.push(`/chat?shop=${encodeURIComponent(shopName)}`)
  }

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
            <Link href="/cart">
              <button className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <ShoppingCart className="h-5 w-5 text-white" />
              </button>
            </Link>
          </div>
        </div>

        {/* Checkout Page Content */}
        <div className="text-white">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          
          {/* Delivery Address Section */}
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-red-500" size={20} />
              <h2 className="text-lg font-medium text-white">Delivery Address</h2>
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{selectedAddress?.name}</p>
                  <p className="text-zinc-400">({selectedAddress?.phone})</p>
                </div>
                <p className="text-zinc-300 mt-1">{selectedAddress?.addressLine1}</p>
                <p className="text-zinc-300">{selectedAddress?.addressLine2}</p>
                <p className="text-zinc-300">{selectedAddress?.addressLine3}</p>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedAddress?.isDefault && (
                  <span className="text-xs border border-red-500 text-red-500 px-2 py-1 rounded">
                    Default
                  </span>
                )}
                {selectedAddress?.isPickupAddress && (
                  <span className="text-xs border border-zinc-500 text-zinc-300 px-2 py-1 rounded">
                    Pickup Address
                  </span>
                )}
                <button 
                  className="text-blue-400 hover:text-blue-300"
                  onClick={toggleAddressModal}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
          
          {/* Products Ordered Section */}
          <div className="bg-zinc-900 rounded-xl overflow-hidden mb-6">
            <div className="p-6 pb-3">
              <h2 className="text-lg font-medium text-white mb-2">Products Ordered</h2>
            </div>
            
            {/* Table headers */}
            <div className="hidden md:grid grid-cols-12 py-3 px-6 border-b border-zinc-800 text-zinc-400 text-sm">
              <div className="col-span-6">Products Ordered</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-center">Amount</div>
              <div className="col-span-2 text-right">Item Subtotal</div>
            </div>
            
            {/* Products List */}
            <div className="divide-y divide-zinc-800">
              {orderedProducts.map((product) => (
                <div key={product.id} className="p-6">
                  {/* Shop name with chat button */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center">
                      <Store className="h-4 w-4 text-zinc-400 mr-2" />
                      <span className="text-zinc-300 text-sm">{product.shopName}</span>
                    </div>
                    <button 
                      onClick={() => navigateToChat(product.shopName)}
                      className="text-green-500 hover:text-green-400 transition-colors flex items-center text-xs"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      chat now
                    </button>
                  </div>
                  
                  {/* Product details */}
                  <div className="md:grid grid-cols-12 gap-4 items-center">
                    {/* Product info */}
                    <div className="col-span-6 flex gap-3 mb-4 md:mb-0">
                      <div className="w-16 h-16 flex-shrink-0 rounded bg-zinc-800 overflow-hidden">
                        <Image 
                          src={product.image} 
                          alt={product.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <p className="text-white text-sm">{product.name}</p>
                        <p className="text-zinc-500 text-xs mt-1">Variation: {product.variation}</p>
                      </div>
                    </div>
                    
                    {/* Pricing */}
                    <div className="col-span-2 text-right">
                      <div className="md:hidden text-zinc-400 text-xs mb-1">Unit Price</div>
                      <p className="text-white">RM{product.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <div className="md:hidden text-zinc-400 text-xs mb-1">Amount</div>
                      <p className="text-white">{product.quantity}</p>
                    </div>
                    
                    <div className="col-span-2 text-right">
                      <div className="md:hidden text-zinc-400 text-xs mb-1">Item Subtotal</div>
                      <p className="text-white">RM{(product.price * product.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Summary Section */}
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Merchandise Subtotal</span>
                <span className="text-white">RM{orderedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Shipping Fee</span>
                <span className="text-white">RM10.00</span>
              </div>
              
              <div className="pt-3 border-t border-zinc-800 flex justify-between">
                <span className="text-zinc-300">Total</span>
                <span className="text-xl font-medium text-red-500">
                  RM{(orderedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0) + 10).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Place Order Button */}
          <div className="mb-20">
            <button className="w-full bg-red-500 hover:bg-red-600 py-3 rounded-xl text-white font-medium transition-colors">
              Place Order
            </button>
          </div>
        </div>
      </div>
      
      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">My Address</h3>
              <button 
                onClick={toggleAddressModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Address List */}
            <div className="max-h-[60vh] overflow-y-auto">
              {userAddresses.map((address) => (
                <div 
                  key={address.id} 
                  className="border-b border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Radio Button */}
                    <div className="mt-1">
                      <button 
                        className={`w-5 h-5 rounded-full border flex-shrink-0 ${
                          tempSelectedAddressId === address.id 
                            ? 'border-4 border-blue-500' 
                            : 'border border-gray-400'
                        }`}
                        onClick={() => setTempSelectedAddressId(address.id)}
                      ></button>
                    </div>
                    
                    {/* Address Info */}
                    <div className="flex-grow">
                      <div className="flex justify-between w-full">
                        <p className="font-medium text-gray-900">{address.name}</p>
                        <button 
                          className="text-blue-500 text-sm"
                          onClick={() => openEditModal(address)}
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{address.phone}</p>
                      <p className="text-gray-800 text-sm mt-2">{address.addressLine1}</p>
                      <p className="text-gray-800 text-sm">{address.addressLine2}</p>
                      <p className="text-gray-800 text-sm">{address.addressLine3}</p>
                      
                      {/* Tags */}
                      <div className="mt-2">
                        {address.isDefault && (
                          <span className="inline-block text-xs border border-red-500 text-red-500 px-2 py-0.5 rounded mr-2">
                            Default
                          </span>
                        )}
                        {address.isPickupAddress && (
                          <span className="inline-block text-xs border border-gray-400 text-gray-700 px-2 py-0.5 rounded">
                            Pickup Address
                          </span>
                        )}
                      </div>
                      
                      {/* Warning Message */}
                      {address.needsUpdate && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-md flex items-start gap-2">
                          <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-800">
                            Some information may no longer up to date, please help us update this address.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="p-4 flex gap-3 border-t border-gray-200">
              <button 
                onClick={toggleAddressModal}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAddressSelection}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Address Modal */}
      {showEditModal && addressToEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Edit Address</h3>
              <button 
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Edit Form */}
            <form onSubmit={handleSubmitEdit} className="p-4">
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">State, Area</label>
                <div className="relative">
                  <input
                    type="text"
                    name="state"
                    value={editFormData.state}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded pr-8"
                    readOnly
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={editFormData.postalCode}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">Unit No (Optional)</label>
                <input
                  type="text"
                  name="unit"
                  value={editFormData.unit}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">House Number, Building, Street Name</label>
                <input
                  type="text"
                  name="addressLine"
                  value={editFormData.addressLine}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 