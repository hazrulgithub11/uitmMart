import { useState, useEffect, useCallback, useRef } from 'react';

type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
};

type QueryOptions = {
  enabled?: boolean;
  retries?: number;
  retryDelay?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
};

/**
 * A custom hook for safely fetching data with retries, error handling, and state management.
 * Helps prevent infinite loading loops by tracking fetch attempts.
 */
export function useSafeQuery<T = unknown>(
  url: string,
  options: QueryOptions = {}
): QueryState<T> & { refetch: () => Promise<void> } {
  const {
    enabled = true,
    retries = 2,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;
  
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
    isSuccess: false
  });
  
  const fetchAttempts = useRef(0);
  const isMounted = useRef(true);
  
  // Function to fetch data with retries
  const fetchData = useCallback(async () => {
    if (!enabled || !url) return;
    
    console.log(`[useSafeQuery] Fetching data from ${url}, attempt ${fetchAttempts.current + 1}`);
    
    // Special case for product and shop API to prevent hot reload loops
    if (/\/api\/(products|shops)\/\d+/.test(url) && fetchAttempts.current > 0) {
      console.error(`Preventing repeated fetches for ${url} to avoid hot reload loops`);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: new Error("Loading stopped to prevent infinite loop")
      }));
      return;
    }
    
    // Prevent unnecessary fetches
    if (fetchAttempts.current > retries) {
      console.error(`Fetching ${url} failed after ${retries} attempts. Stopping to prevent infinite loops.`);
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    fetchAttempts.current += 1;
    
    try {
      // Add a timestamp to prevent caching
      const fetchUrl = url.includes('?') 
        ? `${url}&_t=${Date.now()}`
        : `${url}?_t=${Date.now()}`;
      
      console.log(`[useSafeQuery] Making fetch request to: ${fetchUrl}`);
      const response = await fetch(fetchUrl);
      
      if (!isMounted.current) return;
      
      console.log(`[useSafeQuery] Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[useSafeQuery] Data received:`, data);
      
      if (!isMounted.current) return;
      
      setState({
        data,
        isLoading: false,
        error: null,
        isSuccess: true
      });
      
      if (onSuccess) onSuccess(data);
      
    } catch (error) {
      if (!isMounted.current) return;
      
      console.error(`Error fetching ${url}:`, error);
      
      const typedError = error instanceof Error ? error : new Error(String(error));
      
      setState({
        data: null,
        isLoading: false, // Always set loading to false to break cycles
        error: typedError,
        isSuccess: false
      });
      
      if (onError) onError(typedError);
      
      // Only retry for specific non-API fetch requests that aren't product/shop API calls
      if (fetchAttempts.current <= retries && !/\/api\/(products|shops)\/\d+/.test(url)) {
        setTimeout(() => {
          if (isMounted.current) fetchData();
        }, retryDelay);
      }
    }
  }, [url, enabled, retries, retryDelay, onSuccess, onError]);
  
  // Refetch function that resets the fetch attempts
  const refetch = useCallback(async () => {
    fetchAttempts.current = 0;
    fetchData();
  }, [fetchData]);
  
  // Effect to fetch data on mount and when dependencies change
  useEffect(() => {
    if (enabled && url) {
      fetchAttempts.current = 0;
      fetchData();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [enabled, fetchData, url]);
  
  return { ...state, refetch };
} 