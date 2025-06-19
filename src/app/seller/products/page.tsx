'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  ArrowLeft, 
  ChevronDown, 
  ArrowUpDown,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  PenTool,
  FileText,
  Laptop,
  Usb,
  Shirt,
  Footprints,
  Watch,
  Scissors,
  Cookie,
  Pizza,
  Coffee,
  Sofa,
  Bed,
  Lamp,
  GraduationCap,
  FileCode,
  Gamepad,
  Headphones,
  Clock,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProducts } from '@/hooks/useProducts';

// Product categories with icons
const categories = [
  { id: 1, name: 'Textbooks & Reference', icon: BookOpen },
  { id: 2, name: 'Stationery', icon: PenTool },
  { id: 3, name: 'Past Year Papers', icon: FileText },
  { id: 4, name: 'Electronics', icon: Laptop },
  { id: 5, name: 'USB & Storage', icon: Usb },
  { id: 6, name: 'Clothing', icon: Shirt },
  { id: 7, name: 'Shoes & Sneakers', icon: Footprints },
  { id: 8, name: 'Accessories', icon: Watch },
  { id: 9, name: 'Self-Care & Grooming', icon: Scissors },
  { id: 10, name: 'Snacks & Instant Food', icon: Cookie },
  { id: 11, name: 'Homemade Food', icon: Pizza },
  { id: 12, name: 'Beverages', icon: Coffee },
  { id: 13, name: 'Furniture', icon: Sofa },
  { id: 14, name: 'Bedding & Pillows', icon: Bed },
  { id: 15, name: 'Room Decorations', icon: Lamp },
  { id: 16, name: 'Tutoring Services', icon: GraduationCap },
  { id: 17, name: 'Resume/Templates', icon: FileCode },
  { id: 18, name: 'Digital Art', icon: FileCode },
  { id: 19, name: 'Board Games', icon: Gamepad },
  { id: 20, name: 'Tech Gadgets', icon: Headphones },
];

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Product interface - matches the type from useProducts
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: string;
  images: string[];
  discountPercentage?: number | null;
  discountedPrice?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
}

const SyncWithStripeButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/seller/stripe/sync-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
        
        setSyncResult({
          success: true,
          message: data.message || `Synced products with Stripe`,
        });
        
        // If there are specific product results, add them to the message
        if (data.results && data.results.length > 0) {
          const successfulProducts = data.results
            .filter((r: { success: boolean }) => r.success)
            .map((r: { productId: string }) => `Product ID ${r.productId}`);
            
          if (successfulProducts.length > 0) {
            setSyncResult(prev => {
              if (!prev) return { 
                success: true,
                message: `Synced products: ${successfulProducts.join(', ')}` 
              };
              
              return {
                ...prev,
                message: `${prev.message}. Successfully synced: ${successfulProducts.join(', ')}`
              };
            });
          }
        }
        
        // Refresh the page after 3 seconds if successful
        if (successCount > 0) {
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Failed to sync products with Stripe',
        });
      }
    } catch  {
      setSyncResult({
        success: false,
        message: 'An error occurred during product sync',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`${cartoonStyle.buttonPrimary} px-4 py-2 flex items-center text-sm`}
      >
        {isSyncing ? (
          <>
            <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All Product Data with Stripe
          </>
        )}
      </button>
      
      <div className="text-xs text-gray-600 mt-1 mb-2">
        Syncs names, descriptions, prices, and other details
      </div>
      
      {syncResult && (
        <div className={`text-sm mt-2 p-2 rounded ${syncResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {syncResult.message}
        </div>
      )}
    </div>
  );
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

// Get discount status label and style
const getDiscountStatus = (product: Product) => {
  if (!product?.discountPercentage) return null;
  
  const now = new Date();
  const startDate = product.discountStartDate ? new Date(product.discountStartDate) : null;
  const endDate = product.discountEndDate ? new Date(product.discountEndDate) : null;
  
  if (startDate && now < startDate) {
    return {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-800 border-blue-800',
      icon: <Calendar className="h-3 w-3 mr-1" />
    };
  }
  
  if (endDate && now > endDate) {
    return {
      label: 'Expired',
      className: 'bg-gray-100 text-gray-800 border-gray-800',
      icon: <Clock className="h-3 w-3 mr-1" />
    };
  }
  
  return {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-800',
    icon: null
  };
};

export default function ProductsPage() {
  const router = useRouter();
  const { products, isLoading, error, fetchProducts, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const initialFetchDone = useRef(false);

  // Fetch products on mount ONLY - not on every rerender
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchProducts({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery || undefined
      });
      initialFetchDone.current = true;
    }
  }, [fetchProducts, searchQuery, selectedCategory]);

  // Filter and sort products client-side
  // Note: In a real app with many products, filtering and sorting should be done on the server
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'price') {
      return sortDirection === 'asc' 
        ? Number(a.price) - Number(b.price) 
        : Number(b.price) - Number(a.price);
    } else if (sortBy === 'stock') {
      return sortDirection === 'asc' 
        ? a.stock - b.stock 
        : b.stock - a.stock;
    }
    return 0;
  });

  // Toggle sort direction
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setIsDeleting(id);
      const success = await deleteProduct(id);
      if (success) {
        // Product deleted successfully
      }
      setIsDeleting(null);
    }
  };

  // Handle adding a new product
  const handleAddProduct = () => {
    router.push('/seller/products/add');
  };

  // Handle editing a product
  const handleEditProduct = (id: number) => {
    router.push(`/seller/products/edit/${id}`);
  };

  // Handle filter change
  const handleFilterChange = () => {
    fetchProducts({
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      search: searchQuery || undefined
    });
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white border-2 border-black font-bold">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500 text-white border-2 border-black font-bold">Inactive</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-500 text-white border-2 border-black font-bold">Out of Stock</Badge>;
      default:
        return <Badge className="bg-blue-500 text-white border-2 border-black font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className={`${cartoonStyle.button} text-black hover:bg-gray-100`}
            onClick={() => router.push('/seller')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Badge className="bg-blue-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">Manage Products</Badge>
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <div>
            <h1 className={`${cartoonStyle.heading} text-black`}>Products</h1>
            <p className="text-gray-700 mt-1 font-medium">Manage your product catalog</p>
          </div>
          <div className="flex space-x-3">
            <SyncWithStripeButton />
            <Button 
              className={cartoonStyle.buttonPrimary}
              onClick={handleAddProduct}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and search section */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card className={`${cartoonStyle.card} bg-yellow-50`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-black">Filters & Search</CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Find products by name, category or status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="font-bold text-black">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-700" />
                  <Input
                    id="search"
                    placeholder="Search products..."
                    className={`${cartoonStyle.input} pl-8 text-black`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category" className="font-bold text-black">Category</Label>
                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-700" />
                  <select
                    id="category"
                    className={`${cartoonStyle.input} w-full pl-8 py-2 appearance-none text-black`}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-700" />
                </div>
              </div>
              <div className="flex space-x-2 items-end">
                <Button 
                  variant="outline" 
                  className={`${cartoonStyle.button} text-black`}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSortBy('name');
                    setSortDirection('asc');
                    fetchProducts();
                  }}
                >
                  Reset Filters
                </Button>
                <Button 
                  className={cartoonStyle.buttonPrimary}
                  onClick={handleFilterChange}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products list */}
      <div className="max-w-7xl mx-auto">
        <Card className={`${cartoonStyle.card} bg-white`}>
          <CardHeader className="pb-3 border-b-2 border-black">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-black">Product List</CardTitle>
              <div className="text-sm font-bold text-black">
                {sortedProducts.length} products found
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="font-bold text-black">Loading products...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-red-100 border-2 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Error loading products</h3>
                <p className="mb-6 text-gray-700 font-medium">{error}</p>
                <Button 
                  className={cartoonStyle.buttonPrimary}
                  onClick={() => fetchProducts()}
                >
                  Try Again
                </Button>
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="py-3 px-4 text-left" onClick={() => toggleSort('name')}>
                        <div className="flex items-center cursor-pointer hover:text-blue-600">
                          <span className="font-extrabold text-black">Product Name</span>
                          <ArrowUpDown className="ml-2 h-4 w-4 text-black" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left" onClick={() => toggleSort('price')}>
                        <div className="flex items-center cursor-pointer hover:text-blue-600">
                          <span className="font-extrabold text-black">Price</span>
                          <ArrowUpDown className="ml-2 h-4 w-4 text-black" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left" onClick={() => toggleSort('stock')}>
                        <div className="flex items-center cursor-pointer hover:text-blue-600">
                          <span className="font-extrabold text-black">Stock</span>
                          <ArrowUpDown className="ml-2 h-4 w-4 text-black" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <span className="font-extrabold text-black">Category</span>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <span className="font-extrabold text-black">Status</span>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <span className="font-extrabold text-black">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((product) => (
                      <tr key={product.id} className="border-b-2 border-gray-300 hover:bg-yellow-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 mr-3 bg-white rounded-md overflow-hidden flex-shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              {product.images && product.images.length > 0 ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <span className="text-xs text-gray-500">No img</span>
                                </div>
                              )}
                            </div>
                            <div className="truncate max-w-xs font-bold text-black">
                              {product.name}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {product.discountPercentage ? (
                            <div>
                              {/* Always show original price */}
                              <div className={isDiscountActive(product) ? "line-through text-gray-500" : "font-bold text-black"}>
                                RM {Number(product.price).toFixed(2)}
                              </div>
                              
                              {/* Only show discounted price if discount is active */}
                              {isDiscountActive(product) && (
                                <div className="font-bold text-red-600">
                                  RM {Number(product.discountedPrice).toFixed(2)}
                                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-full border-2 border-red-800">
                                    {product.discountPercentage}% OFF
                                  </span>
                                </div>
                              )}
                              
                              {/* Add discount status indicator */}
                              {getDiscountStatus(product) && (
                                <div className="mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full border-2 ${getDiscountStatus(product)?.className}`}>
                                    {getDiscountStatus(product)?.icon}
                                    {getDiscountStatus(product)?.label}
                                  </span>
                                  {product.discountStartDate && (
                                    <span className="ml-1 text-xs text-gray-600">
                                      {new Date(product.discountStartDate).toLocaleDateString()}
                                      {product.discountEndDate && ` - ${new Date(product.discountEndDate).toLocaleDateString()}`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="font-bold text-black">RM {Number(product.price).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-bold ${product.stock === 0 ? 'text-red-600' : 'text-black'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 bg-blue-100 rounded-lg text-xs font-bold border-2 border-black text-black">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 border-2 border-black rounded-md bg-blue-100 hover:bg-blue-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              onClick={() => router.push(`/seller/products/view/${product.id}`)}
                            >
                              <span className="sr-only">View</span>
                              <Eye className="h-4 w-4 text-black" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 border-2 border-black rounded-md bg-yellow-100 hover:bg-yellow-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              onClick={() => handleEditProduct(product.id)}
                            >
                              <span className="sr-only">Edit</span>
                              <Edit2 className="h-4 w-4 text-black" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 border-2 border-black rounded-md bg-red-100 hover:bg-red-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={isDeleting === product.id}
                            >
                              <span className="sr-only">Delete</span>
                              {isDeleting === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-black" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-black" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-yellow-100 border-2 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Search className="h-10 w-10 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No products found</h3>
                <p className="mb-6 text-gray-700 font-medium">Get started by adding your first product</p>
                <Button 
                  className={cartoonStyle.buttonPrimary}
                  onClick={handleAddProduct}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t-2 border-black pt-4">
            <div className="text-sm font-bold text-black">
              Showing {sortedProducts.length} of {products.length} products
            </div>
            {/* Pagination would go here in a real app */}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
