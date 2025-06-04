'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  MapPin, Phone, Mail, Store, FileText, Upload, ArrowLeft, Save, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Shop form state interface matching the Prisma model
interface ShopFormData {
  name: string;
  description: string;
  logoUrl: string | null;
  phoneNumber: string;
  email: string;
  streetAddress: string;
  building: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}

export default function ShopSettings() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopData, setShopData] = useState<ShopFormData>({
    name: '',
    description: '',
    logoUrl: null,
    phoneNumber: '',
    email: '',
    streetAddress: '',
    building: '',
    city: '',
    postalCode: '',
    state: '',
    country: 'Malaysia',
  });

  // Fetch shop data on component mount and when session changes
  useEffect(() => {
    // Only fetch if we have a logged-in user
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push('/login?callbackUrl=/seller/shop-settings');
      return;
    }
    
    async function fetchShopData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get user ID from session instead of hardcoding
        const userId = session?.user?.id;
        
        if (!userId) {
          setError("User session not found. Please log in again.");
          setIsLoading(false);
          return;
        }
        
        console.log("Fetching shop data for user ID:", userId);
        const response = await fetch(`/api/shop?userId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.shop) {
            console.log("Shop data loaded:", data.shop);
            setShopData({
              name: data.shop.name || '',
              description: data.shop.description || '',
              logoUrl: data.shop.logoUrl || null,
              phoneNumber: data.shop.phoneNumber || '',
              email: data.shop.email || '',
              streetAddress: data.shop.streetAddress || '',
              building: data.shop.building || '',
              city: data.shop.city || '',
              postalCode: data.shop.postalCode || '',
              state: data.shop.state || '',
              country: data.shop.country || 'Malaysia',
            });
          } else {
            console.log("No shop data found for this user. Creating new shop profile.");
          }
        } else if (response.status === 404) {
          // This is expected for new users who don't have a shop yet
          console.log("No shop found for this user, will create a new one when saved");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load shop data');
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
        setError(`Failed to load shop data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchShopData();
  }, [session, status, router]);

  // Handle input change for all text fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShopData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection for shop logo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview URL for the selected image
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // Clear selected file and preview
  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Upload the shop logo to the server
  const uploadLogo = async (): Promise<string | null> => {
    if (!selectedFile) {
      return shopData.logoUrl; // Return existing logo URL if no new file is selected
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Get user ID from session
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error('User session expired. Please log in again.');
      }
      
      formData.append('userId', userId.toString());

      const response = await fetch('/api/shop-logo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload logo');
      }

      return result.filePath; // Return the path to the uploaded file
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Save shop settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Get user ID from session
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error('User session expired. Please log in again.');
      }
      
      // Upload the logo first if a file is selected
      let logoUrl = shopData.logoUrl;
      if (selectedFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl && selectedFile) {
          throw new Error('Failed to upload logo');
        }
      }

      // Call the API to save shop data with the logo URL
      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...shopData,
          logoUrl,
          userId: userId, // Use the current user's ID
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Shop settings saved successfully!');
        router.push('/seller');
      } else {
        throw new Error(result.error || 'Failed to save shop settings');
      }
    } catch (error) {
      console.error('Failed to save shop settings:', error);
      setError(`Failed to save shop settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // If session is loading, show a loading indicator
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="font-bold text-black">Loading user session...</p>
        </div>
      </div>
    );
  }
  
  // If user is not authenticated, they will be redirected (handled in useEffect)
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center flex items-center justify-center">
        <div className="text-center">
          <p className="font-bold text-black">Please log in to access shop settings.</p>
          <Button 
            className={cartoonStyle.buttonPrimary}
            onClick={() => router.push('/login?callbackUrl=/seller/shop-settings')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="font-bold text-black">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header with back button */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className={`${cartoonStyle.button} text-black hover:bg-gray-100`}
            onClick={() => router.push('/seller')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Badge className="bg-green-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">Shop Settings</Badge>
        </div>
        <h1 className={`${cartoonStyle.heading} text-black mt-6 mb-2`}>Shop Settings</h1>
        <p className="text-gray-700 font-medium">Configure your shop profile and settings</p>
        
        {/* Display any errors */}
        {error && (
          <div className="bg-red-100 border-3 border-red-500 text-red-600 px-4 py-3 rounded-xl mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold">{error}</p>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shop Logo Section */}
        <Card className={`${cartoonStyle.card} bg-white col-span-1`}>
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-black">
              <Store className="mr-2 h-5 w-5" />
              Shop Logo
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Upload your shop logo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden relative border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {previewUrl ? (
                // Preview of the newly selected image
                <>
                  <Image 
                    src={previewUrl} 
                    alt="Logo Preview" 
                    width={160} 
                    height={160} 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={handleClearFile}
                    className="absolute top-0 right-0 bg-red-500 rounded-full p-1 m-1 text-white border border-black"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : shopData.logoUrl ? (
                // Existing logo from the database
                <Image 
                  src={shopData.logoUrl} 
                  alt="Shop Logo" 
                  width={160} 
                  height={160} 
                  className="w-full h-full object-cover"
                />
              ) : (
                // No logo placeholder
                <Store className="h-16 w-16 text-gray-500" />
              )}
            </div>
            <label className="cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileSelect}
              />
              <div className={`${cartoonStyle.buttonPrimary} flex items-center px-4 py-2`}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Logo'}
              </div>
            </label>
            {(previewUrl || shopData.logoUrl) && (
              <p className="text-sm text-gray-700 font-medium mt-2 text-center">
                {previewUrl ? 'New logo selected' : 'Current logo'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Shop Information Section */}
        <Card className={`${cartoonStyle.card} bg-white col-span-1 lg:col-span-2`}>
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-black">
              <FileText className="mr-2 h-5 w-5" />
              Shop Information
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Basic information about your shop
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="font-bold text-black block mb-2">
                Shop Name
              </label>
              <input 
                type="text" 
                name="name"
                value={shopData.name}
                onChange={handleInputChange}
                placeholder="Your Shop Name" 
                className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
              />
            </div>
            <div>
              <label className="font-bold text-black block mb-2">
                Shop Description
              </label>
              <textarea 
                rows={4} 
                name="description"
                value={shopData.description}
                onChange={handleInputChange}
                placeholder="Describe your shop in a few sentences..." 
                className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
              ></textarea>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className={`${cartoonStyle.card} bg-white col-span-1 lg:col-span-3`}>
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-black">
              <Phone className="mr-2 h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              How customers can reach you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-black block mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 bg-gray-100 border-3 border-r-0 border-black rounded-l-lg">
                    <Phone className="h-4 w-4 text-gray-700" />
                  </span>
                  <input 
                    type="tel" 
                    name="phoneNumber"
                    value={shopData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+60 12-345-6789" 
                    className="flex-1 px-3 py-2 bg-white border-3 border-black rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" 
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-black block mb-2">
                  Email Address
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 bg-gray-100 border-3 border-r-0 border-black rounded-l-lg">
                    <Mail className="h-4 w-4 text-gray-700" />
                  </span>
                  <input 
                    type="email" 
                    name="email"
                    value={shopData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com" 
                    className="flex-1 px-3 py-2 bg-white border-3 border-black rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className={`${cartoonStyle.card} bg-white col-span-1 lg:col-span-3`}>
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-black">
              <MapPin className="mr-2 h-5 w-5" />
              Shop Location
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Where your shop is located
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-black block mb-2">
                  Address
                </label>
                <input 
                  type="text" 
                  name="streetAddress"
                  value={shopData.streetAddress}
                  onChange={handleInputChange}
                  placeholder="Street Address" 
                  className={`${cartoonStyle.input} w-full px-3 py-2 text-black mb-3`}
                />
                <input 
                  type="text" 
                  name="building"
                  value={shopData.building}
                  onChange={handleInputChange}
                  placeholder="Apt, Suite, Building (optional)" 
                  className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-black block mb-2">
                    City
                  </label>
                  <input 
                    type="text" 
                    name="city"
                    value={shopData.city}
                    onChange={handleInputChange}
                    placeholder="City" 
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`} 
                  />
                </div>
                <div>
                  <label className="font-bold text-black block mb-2">
                    Postal Code
                  </label>
                  <input 
                    type="text" 
                    name="postalCode"
                    value={shopData.postalCode}
                    onChange={handleInputChange}
                    placeholder="Postal Code" 
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`} 
                  />
                </div>
                <div>
                  <label className="font-bold text-black block mb-2">
                    State
                  </label>
                  <input 
                    type="text" 
                    name="state"
                    value={shopData.state}
                    onChange={handleInputChange}
                    placeholder="State" 
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`} 
                  />
                </div>
                <div>
                  <label className="font-bold text-black block mb-2">
                    Country
                  </label>
                  <select 
                    name="country"
                    value={shopData.country}
                    onChange={handleInputChange}
                    className={`${cartoonStyle.input} w-full px-3 py-2 text-black`}
                  >
                    <option value="Malaysia">Malaysia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Thailand">Thailand</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3 border-t-2 border-black pt-4">
            <Button 
              variant="outline" 
              className={`${cartoonStyle.button} text-black`}
              onClick={() => router.push('/seller')}
            >
              Cancel
            </Button>
            <Button 
              className={cartoonStyle.buttonSuccess}
              onClick={handleSaveSettings}
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
