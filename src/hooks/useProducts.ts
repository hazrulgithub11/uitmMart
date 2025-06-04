import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Define product types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  shopId: number;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  images: string[];
}

export const useProducts = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  // Fetch all products - use useCallback to prevent recreation on each render
  const fetchProducts = useCallback(async (filters?: { category?: string; status?: string; search?: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') {
        queryParams.append('category', filters.category);
      }
      if (filters?.status && filters.status !== 'All') {
        queryParams.append('status', filters.status);
      }
      if (filters?.search) {
        queryParams.append('search', filters.search);
      }
      
      const queryString = queryParams.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch a single product - use useCallback
  const fetchProduct = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch product');
      }
      
      const data = await response.json();
      setProduct(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new product - use useCallback
  const createProduct = useCallback(async (productData: ProductFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. First, create the product in your own database
      const createResponse = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create product');
      }
      
      const newProduct = await createResponse.json();
      
      // 2. Then sync this product with Stripe to get Stripe IDs
      const syncResponse = await fetch('/api/seller/stripe/sync-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!syncResponse.ok) {
        console.warn('Product created but not synced with Stripe. Will try again later.');
      }
      
      // 3. Redirect to products page
      router.push('/seller/products');
      return newProduct;
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Update an existing product - use useCallback
  const updateProduct = useCallback(async (id: number, productData: Partial<ProductFormData>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Update the product in your database
      const updateResponse = await fetch(`/api/seller/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      const updatedProduct = await updateResponse.json();
      
      // 2. If price changed, re-sync with Stripe
      if (productData.price) {
        const syncResponse = await fetch('/api/seller/stripe/sync-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!syncResponse.ok) {
          console.warn('Product updated but not synced with Stripe. Will try again later.');
        }
      }
      
      // Update local products and product state
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === id ? updatedProduct : p)
      );
      setProduct(updatedProduct);
      
      // Navigate to products list
      router.push('/seller/products');
      
      return updatedProduct;
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Delete a product - use useCallback
  const deleteProduct = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/seller/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      // Update local products state
      setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
      
      router.refresh();
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    products,
    product,
    isLoading,
    error,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}; 