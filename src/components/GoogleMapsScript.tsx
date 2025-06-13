"use client";

import { useEffect, useState } from 'react';

// Using the actual API key from Google Cloud Console
const API_KEY = "AIzaSyDGXHJg4CHYt6mSA4-Ks3d7TS-9714uOxo";

// Define proper TypeScript interfaces for Google Maps
interface GoogleMapOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
  mapTypeId?: string;
  [key: string]: unknown;
}

interface GoogleMapMouseEvent {
  latLng: {
    lat(): number;
    lng(): number;
  };
}

// Interface for Google Map instance
interface GoogleMapInstance {
  setCenter(latLng: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
  [key: string]: unknown;
}

// Interface for Google Map constructor
interface GoogleMapConstructor {
  new (mapDiv: HTMLElement, opts?: GoogleMapOptions): GoogleMapInstance;
}

declare global {
  interface Window {
    initMap: () => void;
    google: {
      maps: {
        Map: GoogleMapConstructor;
        MapOptions: GoogleMapOptions;
        MapMouseEvent: GoogleMapMouseEvent;
      };
    };
  }
}

interface GoogleMapsScriptProps {
  onLoad?: () => void;
}

export default function GoogleMapsScript({ onLoad }: GoogleMapsScriptProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Skip if already loaded or running on server
    if (loaded || typeof window === 'undefined') return;

    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      setLoaded(true);
      onLoad?.();
      return;
    }

    // Define callback function
    window.initMap = () => {
      setLoaded(true);
      onLoad?.();
    };

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Handle errors
    script.onerror = () => {
      console.error('Google Maps failed to load');
    };
    
    // Add script to document
    document.head.appendChild(script);
    
    // Cleanup
    return () => {
      window.initMap = () => {};
      // Don't remove the script to avoid issues if multiple components use this
    };
  }, [loaded, onLoad]);

  // This component doesn't render anything
  return null;
}