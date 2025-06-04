'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Upload,
  X,
  Save,
  ImagePlus,
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
  Info,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProducts } from '@/hooks/useProducts';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

export default function AddProductPage() {
  const router = useRouter();
  const { createProduct, isLoading: isSaving, error: apiError } = useProducts();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    price?: string;
    stock?: string;
    category?: string;
    images?: string;
  }>({});

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

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
          if (newImages.length === files.length) {
            setSelectedImages(prev => [...prev, ...newImages]);
          }
        }
      };
      
      reader.readAsDataURL(file);
    }
    
    // Clear image error if it exists
    if (errors.images) {
      setErrors(prev => ({
        ...prev,
        images: undefined
      }));
    }
  };

  // Remove an image
  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (!formData.stock) {
      newErrors.stock = 'Stock quantity is required';
    } else if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock must be a non-negative number';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (selectedImages.length === 0) {
      newErrors.images = 'At least one product image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Call the createProduct function from our hook
    const result = await createProduct({
      ...formData,
      images: selectedImages,
    });
    
    if (result) {
      // Product created successfully, redirect happens in the hook
    }
  };

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header section */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className={`${cartoonStyle.button} text-black hover:bg-gray-100`}
            onClick={() => router.push('/seller/products')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <Badge className="bg-blue-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">Add New Product</Badge>
        </div>
        
        <div className="mt-6">
          <h1 className={`${cartoonStyle.heading} text-black`}>Add New Product</h1>
          <p className="text-gray-700 mt-1 font-medium">Create a new product listing for your shop</p>
        </div>
      </div>

      {/* API Error Display */}
      {apiError && (
        <div className="max-w-5xl mx-auto mb-6">
          <Card className={`${cartoonStyle.card} bg-red-100 border-red-500`}>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-bold text-black">Error saving product</p>
                  <p className="text-gray-700 font-medium">{apiError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product form */}
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Product Images Section */}
          <Card className={`${cartoonStyle.card} bg-white col-span-1 md:row-span-2`}>
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-black">
                <ImagePlus className="mr-2 h-5 w-5" />
                Product Images
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Upload images of your product (max 5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Image preview */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative rounded-md overflow-hidden bg-white aspect-square border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Image 
                        src={img} 
                        alt={`Product preview ${index + 1}`} 
                        fill
                        className="object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 border border-black"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Empty placeholders to maintain grid */}
                  {selectedImages.length < 5 && (
                    Array.from({ length: Math.min(5 - selectedImages.length, 2) }).map((_, index) => (
                      <div key={`placeholder-${index}`} className="flex items-center justify-center bg-gray-100 rounded-md aspect-square border-2 border-dashed border-black">
                        <span className="text-gray-500 text-xs">Empty</span>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Upload button */}
                <div>
                  <label className="cursor-pointer w-full">
                    <div className={`${cartoonStyle.buttonPrimary} flex items-center justify-center px-4 py-3`}>
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedImages.length === 0 ? 'Upload Images' : 'Add More Images'}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleImageSelect}
                      disabled={selectedImages.length >= 5 || isSaving}
                    />
                  </label>
                  <p className="text-sm text-gray-700 font-medium mt-2">
                    {selectedImages.length} of 5 images selected
                  </p>
                  {errors.images && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.images}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details Section */}
          <Card className={`${cartoonStyle.card} bg-white col-span-1 md:col-span-2`}>
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-black">
                <Info className="mr-2 h-5 w-5" />
                Product Details
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Enter the basic information about your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Name */}
              <div>
                <Label htmlFor="name" className="font-bold text-black">
                  Product Name <span className="text-red-600">*</span>
                </Label>
                <Input 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. UiTM Engineering Textbook 2023"
                  className={`${cartoonStyle.input} text-black mt-1`}
                  disabled={isSaving}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.name}</p>
                )}
              </div>
              
              {/* Product Description */}
              <div>
                <Label htmlFor="description" className="font-bold text-black">
                  Product Description <span className="text-red-600">*</span>
                </Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product in detail, including condition, features, etc."
                  className={`${cartoonStyle.input} text-black mt-1 min-h-[120px]`}
                  disabled={isSaving}
                />
                {errors.description && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.description}</p>
                )}
              </div>
              
              {/* Price and Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="font-bold text-black">
                    Price (RM) <span className="text-red-600">*</span>
                  </Label>
                  <Input 
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={`${cartoonStyle.input} text-black mt-1`}
                    disabled={isSaving}
                  />
                  {errors.price && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.price}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="stock" className="font-bold text-black">
                    Stock Quantity <span className="text-red-600">*</span>
                  </Label>
                  <Input 
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={`${cartoonStyle.input} text-black mt-1`}
                    disabled={isSaving}
                  />
                  {errors.stock && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.stock}</p>
                  )}
                </div>
              </div>
              
              {/* Category */}
              <div>
                <Label htmlFor="category" className="font-bold text-black">
                  Category <span className="text-red-600">*</span>
                </Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`${cartoonStyle.input} w-full py-2 px-3 text-black mt-1 appearance-none`}
                  disabled={isSaving}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.category}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Submit Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            type="button"
            variant="outline" 
            className={`${cartoonStyle.button} text-black`}
            onClick={() => router.push('/seller/products')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className={cartoonStyle.buttonSuccess}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 