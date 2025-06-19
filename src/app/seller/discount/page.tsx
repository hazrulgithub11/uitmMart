'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Percent, Tag } from 'lucide-react';

// Cartoon UI Style from layout
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  stock: number;
  discountPercentage: number | null;
  discountedPrice: number | null;
  discountStartDate: string | null;
  discountEndDate: string | null;
}

export default function DiscountPage() {
  // These variables are kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch seller's products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/seller/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate discounted price
  const calculateDiscountedPrice = (originalPrice: number, discountPercent: number) => {
    if (discountPercent <= 0 || discountPercent > 100) return originalPrice;
    const price = Number(originalPrice);
    const discountAmount = price * (discountPercent / 100);
    return Number((price - discountAmount).toFixed(2));
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setDiscountPercentage(product.discountPercentage || 0);
    setStartDate(product.discountStartDate ? new Date(product.discountStartDate).toISOString().split('T')[0] : '');
    setEndDate(product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : '');
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Handle discount form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;
    
    try {
      // Calculate the discounted price
      const discountedPrice = calculateDiscountedPrice(Number(selectedProduct.price), discountPercentage);
      
      // Prepare the data for the API
      const discountData = {
        discountPercentage: discountPercentage > 0 ? discountPercentage : null,
        discountedPrice: discountPercentage > 0 ? discountedPrice : null,
        discountStartDate: startDate ? new Date(startDate).toISOString() : null,
        discountEndDate: endDate ? new Date(endDate).toISOString() : null,
      };
      
      // Send the data to the API
      const response = await fetch(`/api/seller/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData),
      });
      
      if (response.ok) {
        // Update the local products list
        setProducts(products.map(product => 
          product.id === selectedProduct.id 
            ? { 
                ...product, 
                discountPercentage: discountPercentage > 0 ? discountPercentage : null,
                discountedPrice: discountPercentage > 0 ? discountedPrice : null,
                discountStartDate: startDate || null,
                discountEndDate: endDate || null
              } 
            : product
        ));
        
        setSuccessMessage(`Discount for ${selectedProduct.name} has been updated successfully!`);
        
        // Reset selected product after successful update
        setSelectedProduct(null);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to update discount');
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      setErrorMessage('An error occurred while updating the discount');
    }
  };

  // Handle removing a discount
  const handleRemoveDiscount = async (productId: number) => {
    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discountPercentage: null,
          discountedPrice: null,
          discountStartDate: null,
          discountEndDate: null,
        }),
      });
      
      if (response.ok) {
        // Update the local products list
        setProducts(products.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                discountPercentage: null,
                discountedPrice: null,
                discountStartDate: null,
                discountEndDate: null
              } 
            : product
        ));
        
        setSuccessMessage('Discount has been removed successfully!');
        
        // Reset selected product if it was the one we just removed discount from
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(null);
        }
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to remove discount');
      }
    } catch (error) {
      console.error('Error removing discount:', error);
      setErrorMessage('An error occurred while removing the discount');
    }
  };

  // Check if a discount is currently active
  const isDiscountActive = (product: Product) => {
    if (!product.discountPercentage) return false;
    
    const now = new Date();
    const startDate = product.discountStartDate ? new Date(product.discountStartDate) : null;
    const endDate = product.discountEndDate ? new Date(product.discountEndDate) : null;
    
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="ml-3 font-bold">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-black">
      <h1 className={`${cartoonStyle.heading} mb-8`}>Manage Product Discounts</h1>
      
      {/* Success and error messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
          <p>{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{errorMessage}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="md:col-span-2">
          <div className={`${cartoonStyle.card}`}>
            <h2 className="text-xl font-bold mb-4">Your Products</h2>
            
            {products.length === 0 ? (
              <p>No products found. Add products first to set discounts.</p>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className={`border-3 border-black rounded-lg p-4 cursor-pointer transition-all hover:translate-x-1 ${selectedProduct?.id === product.id ? 'bg-blue-100' : 'bg-white'}`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 relative border-2 border-black rounded-md overflow-hidden">
                        <Image
                          src={product.images[0] || '/images/placeholder.svg'}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <h3 className="font-bold">{product.name}</h3>
                        <div className="flex items-center mt-1">
                          {product.discountPercentage ? (
                            <>
                              <p className="text-gray-500 line-through mr-2">RM{Number(product.price).toFixed(2)}</p>
                              <p className="font-bold text-red-600">RM{Number(product.discountedPrice).toFixed(2)}</p>
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full border-2 border-red-800">
                                {product.discountPercentage}% OFF
                              </span>
                            </>
                          ) : (
                            <p className="font-bold">RM{Number(product.price).toFixed(2)}</p>
                          )}
                        </div>
                        {product.discountPercentage && (
                          <div className="mt-1 text-xs">
                            {isDiscountActive(product) ? (
                              <span className="text-green-600 font-semibold">Active discount</span>
                            ) : (
                              <span className="text-gray-600">
                                {product.discountStartDate && new Date(product.discountStartDate) > new Date() 
                                  ? 'Scheduled discount' 
                                  : 'Expired discount'}
                              </span>
                            )}
                            {product.discountStartDate && (
                              <span className="ml-2">
                                {new Date(product.discountStartDate).toLocaleDateString()} 
                                {product.discountEndDate && ` - ${new Date(product.discountEndDate).toLocaleDateString()}`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {product.discountPercentage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDiscount(product.id);
                          }}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-md border-2 border-black hover:bg-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Discount Form */}
        <div>
          <div className={`${cartoonStyle.card}`}>
            <h2 className="text-xl font-bold mb-4">Set Discount</h2>
            
            {selectedProduct ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Selected Product</label>
                  <p className="font-semibold">{selectedProduct.name}</p>
                  <p>Original Price: RM{Number(selectedProduct.price).toFixed(2)}</p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="discountPercentage" className="block text-sm font-bold mb-2">
                    Discount Percentage (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="number"
                      id="discountPercentage"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                      className={`${cartoonStyle.input} pl-10 w-full py-2 px-3`}
                      required
                    />
                  </div>
                </div>
                
                {discountPercentage > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-sm">
                      <span className="font-bold">Original Price:</span> RM{Number(selectedProduct.price).toFixed(2)}
                    </p>
                    <p className="text-sm">
                      <span className="font-bold">Discounted Price:</span> RM{calculateDiscountedPrice(Number(selectedProduct.price), discountPercentage).toFixed(2)}
                    </p>
                    <p className="text-sm">
                      <span className="font-bold">Customer Saves:</span> RM{(Number(selectedProduct.price) - calculateDiscountedPrice(Number(selectedProduct.price), discountPercentage)).toFixed(2)}
                    </p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="startDate" className="block text-sm font-bold mb-2">
                    Start Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`${cartoonStyle.input} pl-10 w-full py-2 px-3`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty for immediate start</p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="endDate" className="block text-sm font-bold mb-2">
                    End Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className={`${cartoonStyle.input} pl-10 w-full py-2 px-3`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className={`${cartoonStyle.button} px-4 py-2`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`${cartoonStyle.buttonPrimary} px-4 py-2`}
                  >
                    {selectedProduct.discountPercentage ? 'Update Discount' : 'Apply Discount'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <Tag className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">Select a product to set a discount</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 