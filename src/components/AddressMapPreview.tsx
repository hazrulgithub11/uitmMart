"use client";

import { useRef } from 'react';
import GoogleMapsScript from './GoogleMapsScript';

interface AddressMapPreviewProps {
  latitude?: number | null;
  longitude?: number | null;
  height?: string;
  width?: string;
}


export default function AddressMapPreview({ 
  latitude, 
  longitude, 
  height = "120px",
  width = "100%"
}: AddressMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Only render map if we have coordinates
  if (!latitude || !longitude) {
    return (
      <div 
        className="rounded-lg border-2 border-gray-300 bg-gray-100 flex items-center justify-center text-gray-500 text-sm"
        style={{ height, width }}
      >
        No map location available
      </div>
    );
  }
  
  const handleMapLoad = () => {
    if (!mapRef.current || !window.google || !latitude || !longitude) return;
    
    // Create a static map
    const mapOptions = {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: false,
      scrollwheel: false,
      clickableIcons: false,
      draggable: false
    };
    
    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    
    // Add a marker
    new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: map as unknown as google.maps.Map,
      animation: null,
    });
  };
  
  return (
    <div 
      className="relative rounded-lg border-2 border-black overflow-hidden"
      style={{ height, width }}
    >
      <GoogleMapsScript onLoad={handleMapLoad} />
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
} 