'use client';

import React, { useEffect, useState, useRef } from "react";
import { useApp } from "@/hooks/useApp";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Point, Structure } from "@/types";
import type L from 'leaflet';

export interface TestingData {
  isActive: boolean;
  boundaryType: 'map' | 'walk' | 'trigger';
  map: L.Map | null;
}

export default function TestingMode({ isActive, boundaryType, map }: TestingData) {
  const { structures } = useApp();
  const { position, accuracy, startTracking, stopTracking } = useGeolocation();
  const [testingMessage, setTestingMessage] = useState<string>("");
  const [insideStructures, setInsideStructures] = useState<string[]>([]);

  const positionMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Start or stop tracking based on isActive state
  useEffect(() => {
    if (isActive) {
      console.log("Testing mode activated - starting location tracking");
      startTracking();
    } else {
      console.log("Testing mode deactivated - stopping location tracking");
      stopTracking();
    }
    
    // Always clean up tracking when component unmounts
    return () => {
      stopTracking();
    };
  }, [isActive]);

  // Check structures and update messages
  useEffect(() => {
    if (!isActive || !position) return;

    if (structures.length > 0) {
      const lat = position.lat; 
      const lng = position.lng;

      // Check which structures contain the current position
      const containingStructures = structures.filter(structure => 
        isPointInStructure(lat, lng, structure, boundaryType)
      );

      const structureNames = containingStructures.map(s => s.name);
      setInsideStructures(structureNames);

      if (containingStructures.length > 0) {
        setTestingMessage(
          `You are inside: ${structureNames.join(", ")}\nPosition: (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        );
      } else {
        setTestingMessage(
          `Outside all structures\nPosition: (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        );
      }
    } else {
      setTestingMessage("Waiting for structures data...");
    }
  }, [isActive, position, structures, boundaryType]);

  // Update position marker on map
  useEffect(() => {
    if (!map || !position || !isActive) return;
    
    // Remove previous marker and circle
    if (positionMarkerRef.current && map.hasLayer(positionMarkerRef.current)) {
      map.removeLayer(positionMarkerRef.current);
      positionMarkerRef.current = null;
    }
    
    if (accuracyCircleRef.current && map.hasLayer(accuracyCircleRef.current)) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }
    
    // Only create if we're in the browser
    if (typeof window !== 'undefined') {
      try {
        // Import Leaflet
        const L = require('leaflet');
        
        // Add position marker
        const marker = L.marker([position.lat, position.lng], {
          icon: L.divIcon({
            className: 'position-marker',
            html: `<div class="bg-red-500 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs relative z-[9999]">
                    <span class="animate-ping absolute w-full h-full rounded-full bg-red-400 opacity-75"></span>
                    <span class="relative">📍</span>
                  </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map);
        
        positionMarkerRef.current = marker;
        
        // Add accuracy circle if accuracy is available
        if (accuracy) {
          const circle = L.circle([position.lat, position.lng], {
            radius: accuracy,
            color: '#ff4136',
            fillColor: '#ff4136',
            fillOpacity: 0.1,
            weight: 1,
            zIndex: 400
          }).addTo(map);
          accuracyCircleRef.current = circle;
        }
        
        // Center map on position
        map.setView([position.lat, position.lng], map.getZoom());
      } catch (error) {
        console.error("Error creating marker:", error);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (positionMarkerRef.current && map && map.hasLayer(positionMarkerRef.current)) {
        map.removeLayer(positionMarkerRef.current);
      }
      
      if (accuracyCircleRef.current && map && map.hasLayer(accuracyCircleRef.current)) {
        map.removeLayer(accuracyCircleRef.current);
      }
    };
  }, [position, accuracy, isActive]);

  /**
   * Check if a point is within a specific structure
   */
  function isPointInStructure(
    lat: number, 
    lng: number, 
    structure: Structure, 
    boundaryType: 'map' | 'walk' | 'trigger'
  ): boolean {
    const point = { lat, lng };
    
    // Choose which boundary to check against
    let polygonPoints: Point[] = [];
    
    if (boundaryType === 'map' && structure.mapPoints.length >= 3) {
      polygonPoints = structure.mapPoints;
    } else if (boundaryType === 'walk' && structure.walkPoints.length >= 3) {
      polygonPoints = structure.walkPoints;
    } else if (boundaryType === 'trigger' && 
               structure.triggerBand && 
               structure.triggerBand.points.length >= 3) {
      polygonPoints = structure.triggerBand.points;
    } else {
      // Fall back to map points if preferred boundary isn't available
      if (structure.mapPoints.length >= 3) {
        polygonPoints = structure.mapPoints;
      }
    }
    
    // If we don't have enough points for a polygon, return false
    if (polygonPoints.length < 3) {
      return false;
    }
    
    return isPointInPolygon(point, polygonPoints);
  }

  /**
   * Check if a point is inside a polygon using ray casting algorithm
   */
  function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    // Ray casting algorithm
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;
      
      const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
          (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  if (!isActive) {
    return null;
  }

  return (
    <div className="absolute z-[500] top-2 left-[20%] rounded-lg bg-white shadow-xl border border-green-500 overflow-hidden">
      <div className="bg-green-700 py-2 px-4">
        <h3 className="text-white font-semibold text-base">Testing Mode: {boundaryType.charAt(0).toUpperCase() + boundaryType.slice(1, boundaryType.length)}</h3>
      </div>
      <div className="p-4 max-w-xs">
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${insideStructures.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-semibold">
            {insideStructures.length > 0 ? 'Inside Structure' : 'Outside All Structures'}
          </span>
        </div>
        <p className="text-sm whitespace-pre-line">
          {testingMessage || "TESTING MODE IS ACTIVE."}
        </p>
      </div>
    </div>
  );
}