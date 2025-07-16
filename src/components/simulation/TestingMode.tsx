'use client';

import React, { useEffect, useState } from "react";
import { useApp } from "@/hooks/useApp";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Point, Structure } from "@/types";

export interface TestingData {
  isActive: boolean;
  boundaryType: 'map' | 'walk' | 'trigger';
}

export default function TestingMode({ isActive, boundaryType }: TestingData) {
  const { structures } = useApp();
  const { position } = useGeolocation();
  const [testingMessage, setTestingMessage] = useState<string>("");
  const [insideStructures, setInsideStructures] = useState<string[]>([]);

  /**
   * Define an interval to check the geolocation and structures
   */
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (position && structures.length > 0) {
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
        setTestingMessage("Waiting for geolocation or structures...");
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isActive, position, structures, boundaryType]);

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
    <div className="absolute z-26 top-2 left-[20%] rounded-lg bg-white shadow-xl border border-green-500 overflow-hidden">
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