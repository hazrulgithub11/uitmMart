"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, MapPin, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import GoogleMapPicker from '@/components/GoogleMapPicker';
import AddressMapPreview from '@/components/AddressMapPreview';

// Cartoon UI Style (same as in profile page)
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full px-3 py-2",
  label: "block text-sm font-bold mb-2 text-black",
  defaultTag: "inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded border-2 border-black",
};

// Address interface
interface Address {
  id: number;
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export default function AddressesPage() {
  const router = useRouter();
  const { status } = useSession();
  
  // State for addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the address form
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Map state
  const [locationSelected, setLocationSelected] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Omit<Address, 'id' | 'isDefault'>>({
    recipientName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Malaysia',
    latitude: undefined,
    longitude: undefined,
  });
  
  // Fetch addresses when component mounts
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAddresses();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Function to fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/addresses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }
      
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to reset form
  const resetForm = () => {
    setFormData({
      recipientName: '',
      phoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Malaysia',
      latitude: undefined,
      longitude: undefined,
    });
    setIsAddingAddress(false);
    setIsEditingAddress(false);
    setCurrentAddressId(null);
  };
  
  // Function to handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to handle location selection from map
  const handleLocationSelect = (location: { lat: number, lng: number }) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
    setLocationSelected(true);
  };
  
  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      if (isEditingAddress && currentAddressId) {
        // Update existing address
        const response = await fetch('/api/addresses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: currentAddressId,
            ...formData,
            // Keep current default status if editing
            isDefault: addresses.find(addr => addr.id === currentAddressId)?.isDefault || false
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update address');
        }
        
        toast.success('Address updated successfully');
      } else {
        // Create new address
        const response = await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            isDefault: addresses.length === 0 // Make default if it's the first address
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create address');
        }
        
        toast.success('Address added successfully');
      }
      
      // Refresh addresses
      await fetchAddresses();
      
      // Reset form and map state
      resetForm();
      setLocationSelected(false);
    } catch (error) {
      console.error('Error submitting address:', error);
      toast.error((error as Error).message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to edit an address
  const handleEditAddress = (address: Address) => {
    setFormData({
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
    });
    
    setCurrentAddressId(address.id);
    setIsEditingAddress(true);
    setIsAddingAddress(true);
  };
  
  // Function to set an address as default
  const handleSetDefault = async (id: number) => {
    try {
      const response = await fetch('/api/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          isDefault: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to set default address');
      }
      
      // Update local state
      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === id
        }))
      );
      
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to set default address');
    }
  };
  
  // Function to delete an address
  const handleDeleteAddress = async (id: number) => {
    try {
      const response = await fetch(`/api/addresses?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete address');
      }
      
      // Remove from local state
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };
  
  // Show loading state
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-4 flex items-center justify-center">
        <div className={`${cartoonStyle.card} p-8`}>
          <h1 className={cartoonStyle.heading}>Loading...</h1>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-4">
      {/* Back button */}
      <Link 
        href="/profile" 
        className={`${cartoonStyle.button} fixed top-4 left-4 p-2 z-20 flex items-center gap-2`}
      >
        <ArrowLeft size={18} className="text-black" />
        <span className="hidden sm:inline font-bold text-black">Back to Profile</span>
      </Link>
      
      <div className="max-w-4xl mx-auto pt-16">
        <div className={`${cartoonStyle.card} mb-6`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className={`${cartoonStyle.heading} text-black`}>My Addresses</h1>
            
            {!isAddingAddress && (
              <button 
                onClick={() => setIsAddingAddress(true)}
                className={`${cartoonStyle.buttonPrimary} flex items-center gap-2 px-4 py-2`}
              >
                <Plus size={18} />
                <span className="font-bold">Add New Address</span>
              </button>
            )}
          </div>
          
          {/* Address Form */}
          {isAddingAddress && (
            <div className="mb-8 border-3 border-black rounded-xl p-6 bg-blue-50">
              <h2 className="text-xl font-bold mb-4 text-black">
                {isEditingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={cartoonStyle.label}>Full Name</label>
                    <input
                      type="text"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} text-black`}
                      placeholder="Enter recipient's full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={cartoonStyle.label}>Phone Number</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} text-black`}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className={cartoonStyle.label}>Address Line 1</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} text-black`}
                      placeholder="Street address, P.O. box, company name"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className={cartoonStyle.label}>Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} text-black`}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>
                  
                  <div>
                    <label className={cartoonStyle.label}>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} text-black`}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={cartoonStyle.label}>State/Province</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} text-black`}
                      placeholder="Enter state or province"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={cartoonStyle.label}>Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} text-black`}
                      placeholder="Enter postal code"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={cartoonStyle.label}>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} text-black`}
                      placeholder="Enter country"
                      required
                    />
                  </div>
                  
                  {/* Google Maps Location Picker */}
                  <div className="md:col-span-2 mt-4">
                    <label className={cartoonStyle.label}>
                      Precise Location
                      <span className="ml-2 text-xs font-normal text-gray-600">
                        (Select your exact location for accurate delivery)
                      </span>
                    </label>
                    <GoogleMapPicker 
                      initialValue={
                        formData.latitude && formData.longitude 
                          ? { lat: formData.latitude, lng: formData.longitude } 
                          : undefined
                      }
                      onLocationSelect={handleLocationSelect}
                      height="350px"
                    />
                    {locationSelected && (
                      <div className="mt-2 text-sm text-emerald-600 font-medium">
                        <span className="block">✓ Location selected!</span>
                        <span className="block mt-1">Coordinates: {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`${cartoonStyle.buttonSuccess} px-6 py-2 font-bold ${submitting ? 'opacity-70' : ''}`}
                  >
                    {submitting ? 'Saving...' : isEditingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    className={`${cartoonStyle.button} px-6 py-2 font-bold text-black ${submitting ? 'opacity-70' : ''}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* List of Addresses */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-black">Address</h2>
            
            {addresses.length === 0 ? (
              <div className="bg-gray-100 border-3 border-black rounded-xl p-6 text-center">
                <p className="text-gray-600 font-medium">You don&apos;t have any saved addresses yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {addresses.map(address => (
                  <div 
                    key={address.id} 
                    className="border-3 border-black rounded-xl p-5 bg-white relative"
                  >
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-black mb-1 flex items-center gap-2">
                          {address.recipientName} 
                          <span className="text-gray-600 font-normal">
                            {address.phoneNumber}
                          </span>
                        </div>
                        
                        <div className="text-gray-700">
                          <p>{address.addressLine1}</p>
                          {address.addressLine2 && <p>{address.addressLine2}</p>}
                          <p>{address.city}, {address.state}, {address.postalCode}</p>
                          <p>{address.country}</p>
                        </div>
                        
                        {address.isDefault && (
                          <div className="mt-2">
                            <span className={cartoonStyle.defaultTag}>Default</span>
                          </div>
                        )}
                        
                        {/* Show coordinates if available */}
                        {address.latitude && address.longitude && (
                          <div className="mt-2 text-xs text-gray-500">
                            GPS: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                          </div>
                        )}
                      </div>
                      
                      {/* Map preview */}
                      <div className="ml-4 hidden sm:block">
                        <AddressMapPreview 
                          latitude={address.latitude} 
                          longitude={address.longitude}
                          height="120px"
                          width="180px"
                        />
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <button 
                          onClick={() => handleEditAddress(address)}
                          className="p-2 bg-blue-100 rounded-lg border-2 border-black hover:bg-blue-200 transition-colors"
                          aria-label="Edit address"
                        >
                          <Edit size={18} className="text-blue-600" />
                        </button>
                        
                        {!address.isDefault && (
                          <button 
                            onClick={() => handleSetDefault(address.id)}
                            className="p-2 bg-emerald-100 rounded-lg border-2 border-black hover:bg-emerald-200 transition-colors"
                            aria-label="Set as default address"
                          >
                            <MapPin size={18} className="text-emerald-600" />
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleDeleteAddress(address.id)}
                          className="p-2 bg-red-100 rounded-lg border-2 border-black hover:bg-red-200 transition-colors"
                          aria-label="Delete address"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 