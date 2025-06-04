"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useRef, useState } from 'react';
import GoogleMapsScript from './GoogleMapsScript';

interface LatLng {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  initialValue?: LatLng;
  onLocationSelect: (location: LatLng) => void;
  height?: string;
}

export default function GoogleMapPicker({ 
  initialValue, 
  onLocationSelect,
  height = "400px" 
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchBox, setSearchBox] = useState<any>(null);

  // Default to Malaysia's center if no initial value
  const defaultCenter = { lat: 4.2105, lng: 101.9758 }; // Center of Malaysia
  
  // Effect to initialize map once Google Maps is loaded
  const handleGoogleMapsLoaded = () => {
    if (!mapRef.current || !window.google) return;
    
    // Create map instance
    const mapOptions = {
      center: initialValue || defaultCenter,
      zoom: initialValue ? 15 : 7,
      mapId: 'DEMO_MAP_ID', // Replace with your map ID if you have one
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
    };
    
    const mapInstance = new (window.google.maps.Map as any)(mapRef.current, mapOptions);
    setMap(mapInstance);
    
    // Add marker if initial value exists
    if (initialValue) {
      const markerInstance = new (window.google.maps.Marker as any)({
        position: initialValue,
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      
      setMarker(markerInstance);
      
      // Handle marker drag
      markerInstance.addListener('dragend', () => {
        const position = markerInstance.getPosition();
        if (position) {
          onLocationSelect({ 
            lat: position.lat(), 
            lng: position.lng() 
          });
        }
      });
    }
    
    // Handle map click to set/move marker
    mapInstance.addListener('click', (e: any) => {
      const position = e.latLng;
      if (!position) return;
      
      // Get position coordinates
      const lat = position.lat();
      const lng = position.lng();
      
      // Update or create marker
      if (marker) {
        marker.setPosition(position);
      } else {
        const newMarker = new (window.google.maps.Marker as any)({
          position: { lat, lng },
          map: mapInstance,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
        });
        
        // Handle marker drag
        newMarker.addListener('dragend', () => {
          const newPosition = newMarker.getPosition();
          if (newPosition) {
            onLocationSelect({ 
              lat: newPosition.lat(), 
              lng: newPosition.lng() 
            });
          }
        });
        
        setMarker(newMarker);
      }
      
      // Call callback with selected location
      onLocationSelect({ lat, lng });
    });
    
    // Add search box
    const input = document.createElement('input');
    input.placeholder = 'Search for a location';
    input.className = 'bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full px-3 py-2 text-black';
    
    const searchBoxDiv = document.createElement('div');
    searchBoxDiv.className = 'absolute top-4 left-0 right-0 mx-auto z-10 w-[80%] max-w-md';
    searchBoxDiv.style.left = '0';
    searchBoxDiv.style.right = '0';
    searchBoxDiv.style.margin = '0 auto';
    searchBoxDiv.appendChild(input);
    
    mapRef.current.appendChild(searchBoxDiv);
    
    const searchBoxInstance = new (window.google.maps.places.SearchBox as any)(input);
    mapInstance.controls[window.google.maps.ControlPosition.TOP_CENTER].push(searchBoxDiv);
    setSearchBox(searchBoxInstance);
    
    // Listen for search box changes
    searchBoxInstance.addListener('places_changed', () => {
      const places = searchBoxInstance.getPlaces();
      if (!places || places.length === 0) return;
      
      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;
      
      // Center map on search result
      mapInstance.setCenter(place.geometry.location);
      mapInstance.setZoom(17);
      
      // Update or create marker
      const location = place.geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      
      if (marker) {
        marker.setPosition(location);
      } else {
        const newMarker = new (window.google.maps.Marker as any)({
          position: { lat, lng },
          map: mapInstance,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
        });
        
        // Handle marker drag
        newMarker.addListener('dragend', () => {
          const newPosition = newMarker.getPosition();
          if (newPosition) {
            onLocationSelect({ 
              lat: newPosition.lat(), 
              lng: newPosition.lng() 
            });
          }
        });
        
        setMarker(newMarker);
      }
      
      // Call callback with selected location
      onLocationSelect({ lat, lng });
    });
    
    // Try to get user's current location
    if (navigator.geolocation && !initialValue) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          mapInstance.setCenter(userLocation);
          mapInstance.setZoom(15);
          
          // Create marker at user location
          const userMarker = new (window.google.maps.Marker as any)({
            position: userLocation,
            map: mapInstance,
            draggable: true,
            animation: window.google.maps.Animation.DROP,
          });
          
          // Handle marker drag
          userMarker.addListener('dragend', () => {
            const newPosition = userMarker.getPosition();
            if (newPosition) {
              onLocationSelect({ 
                lat: newPosition.lat(), 
                lng: newPosition.lng() 
              });
            }
          });
          
          setMarker(userMarker);
          
          // Call callback with user location
          onLocationSelect(userLocation);
        },
        () => {
          console.log('Geolocation permission denied or unavailable');
        }
      );
    }
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <GoogleMapsScript onLoad={handleGoogleMapsLoaded} />
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border-3 border-black overflow-hidden"
      />
      {!initialValue && (
        <div className="mt-2 text-sm text-gray-600">
          Click on the map to select a location or use the search box
        </div>
      )}
    </div>
  );
} 