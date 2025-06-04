import { useState } from 'react';

// Define shop types
export interface Shop {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  email: string | null;
  phoneNumber: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: number;
    fullName: string;
    email: string;
  }
}

export function useShops() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Fetch a shop by its ID
   */
  const fetchShopById = async (shopId: number): Promise<Shop | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch shop');
      }
      
      const data = await response.json();
      return data;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Fetch the current seller's shop
   */
  const fetchSellerShop = async (): Promise<Shop | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shops');
      
      if (!response.ok) {
        if (response.status === 404) {
          // No shop found is not an error, just return null
          return null;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch shop');
      }
      
      const data = await response.json();
      return data;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    fetchShopById,
    fetchSellerShop,
    isLoading,
    error
  };
} 