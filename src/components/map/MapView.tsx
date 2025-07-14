'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/hooks/useApp';
import { initMap, centerMap, getStructureBounds } from '@/utils/mapUtils';
import type L from 'leaflet';

interface MapViewProps {
  onMapReady?: (map: L.Map) => void;
}

export default function MapView({ onMapReady }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { activeStructure, mapState, setMapState, mapMode } = useApp();
  
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
    
    // Add zoom control to top-right corner
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      L.control.zoom({
        position: 'topright'
      }).addTo(map);
    }
    
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
      // Don't interrupt user if they're actively adding points or in walking mode
      if (mapMode === 'view' || mapMode === 'editPoints') {
        mapRef.current.setView(
          [mapState.center.lat, mapState.center.lng], 
          mapState.zoom
        );
      }
    }
  }, [mapState, mapMode]);
  
  // Center map on active structure when it changes
  useEffect(() => {
    if (!mapRef.current || !activeStructure) return;
    
    // If structure has map points, center on those
    if (activeStructure.mapPoints.length > 0) {
      // Calculate center of map points
      const points = activeStructure.mapPoints;
      const center = {
        lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
        lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length
      };
      
      // Use bounds if there are enough points to form a polygon
      if (points.length >= 3) {
        const bounds = getStructureBounds(activeStructure);
        if (bounds && mapRef.current) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        } else {
          centerMap(mapRef.current, center);
        }
      } else {
        centerMap(mapRef.current, center);
      }
    } 
    // If no map points but has walk points, center on those
    else if (activeStructure.walkPoints.length > 0) {
      const points = activeStructure.walkPoints;
      const center = {
        lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
        lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length
      };
      
      centerMap(mapRef.current, center);
    }
    // If has trigger band points, center on those
    else if (activeStructure.triggerBand?.points.length > 0) {
      const points = activeStructure.triggerBand.points;
      const center = {
        lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
        lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length
      };
      
      centerMap(mapRef.current, center);
    }
  }, [activeStructure]);
  
  // Update cursor style based on map mode
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    if (mapMode === 'addMapPoints' || mapMode === 'addWalkPoints' || mapMode === 'triggerBand') {
      mapContainerRef.current.style.cursor = 'crosshair';
    } else {
      mapContainerRef.current.style.cursor = '';
    }
    
    return () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.style.cursor = '';
      }
    };
  }, [mapMode]);
  
  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-10"
      />
    </div>
  );
}