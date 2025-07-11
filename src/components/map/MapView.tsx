'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/hooks/useApp';
import { initMap, centerMap } from '@/utils/mapUtils';
import type L from 'leaflet';

interface MapViewProps {
  onMapReady?: (map: L.Map) => void;
}

export default function MapView({ onMapReady }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { activeStructure, mapState, setMapState } = useApp();
  
  // Import Leaflet icons only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/lib/leafletIcons');
    }
  }, []);
  
  // Initialize map only once on component mount
  useEffect(() => {
    // Return early if map is already initialized or container isn't ready
    if (!mapContainerRef.current || mapRef.current) return;
    
    // Create map instance using state from context
    const map = initMap(
      mapContainerRef.current,
      mapState.center,
      mapState.zoom
    );
    
    mapRef.current = map;
    
    // Notify parent component that map is ready
    if (onMapReady) {
      onMapReady(map);
    }
    
    // Save map state on moveend
    map.on('moveend', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const newState = {
        center: { lat: center.lat, lng: center.lng },
        zoom
      };
      
      setMapState(newState);
    });
    
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array means this effect runs only once on mount
  
  // Update map when mapState changes in context
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Only update if the map isn't already at this position
    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();
    
    const centerChanged = 
      Math.abs(currentCenter.lat - mapState.center.lat) > 0.0001 || 
      Math.abs(currentCenter.lng - mapState.center.lng) > 0.0001;
    
    const zoomChanged = currentZoom !== mapState.zoom;
    
    if (centerChanged || zoomChanged) {
      mapRef.current.setView(
        [mapState.center.lat, mapState.center.lng], 
        mapState.zoom
      );
    }
  }, [mapState]);
  
  // Center map on active structure when it changes
  useEffect(() => {
    if (!mapRef.current || !activeStructure || activeStructure.mapPoints.length === 0) return;
    
    // Calculate center of structure points
    const points = activeStructure.mapPoints;
    const center = {
      lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
      lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length
    };
    
    centerMap(mapRef.current, center);
  }, [activeStructure]);
  
  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-10"
      />
    </div>
  );
}