'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { calculateTriggerBandBetweenPolygons } from '@/utils/geoUtils';
import { Point } from '@/types';
import type L from 'leaflet';

interface TriggerBandControlsProps {
  map: L.Map | null;
}

export default function TriggerBandControls({ map }: TriggerBandControlsProps) {
  const { 
    activeStructure, 
    mapMode,
    updateTriggerBand
  } = useApp();
  
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  
  // Calculate if we can generate a trigger band
  const canGenerateBand = activeStructure && 
    activeStructure.mapPoints.length >= 3 && 
    activeStructure.walkPoints.length >= 3;
  
  // Only show when in trigger band mode or we have a complete structure
  const showControls = activeStructure && 
    (mapMode === 'triggerBand' || 
     (activeStructure.mapPoints.length >= 3 && activeStructure.walkPoints.length >= 3));
  
  // Set status message with type and auto-clear
  const setStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => setStatusMessage(null), 3000);
  };
  
  // Regenerate the trigger band
  const regenerateTriggerBand = () => {
    if (!activeStructure) return;
    
    if (!canGenerateBand) {
      setStatus("Need at least 3 points in both map and walk boundaries", "error");
      return;
    }
    
    try {
      // Align walk points to match the map points ordering
      const alignedWalkPoints = alignPolygonVertices(
        activeStructure.walkPoints,
        activeStructure.mapPoints
      );
      
      // Calculate trigger band
      const triggerPoints = calculateTriggerBandBetweenPolygons(
        activeStructure.mapPoints,
        alignedWalkPoints
      );
      
      if (triggerPoints.length < 3) {
        setStatus("Failed to generate trigger band - not enough points", "error");
        return;
      }
      
      // Update the trigger band
      updateTriggerBand(triggerPoints);
      
      setStatus(`Trigger band generated successfully`, "success");
    } catch (error) {
      console.error("Error generating trigger band:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };
  
  // Helper function to align polygon vertices
  function alignPolygonVertices(walkPoints: Point[], mapPoints: Point[]): Point[] {
    if (walkPoints.length < 3 || mapPoints.length < 3) return walkPoints;
    
    // Find centroid of both polygons
    const walkCentroid = getCentroid(walkPoints);
    
    // Sort walk points by angle from centroid (clockwise order)
    const sortedWalkPoints = [...walkPoints].sort((a, b) => {
      const angleA = Math.atan2(a.lat - walkCentroid.lat, a.lng - walkCentroid.lng);
      const angleB = Math.atan2(b.lat - walkCentroid.lat, b.lng - walkCentroid.lng);
      return angleA - angleB;
    });
    
    return sortedWalkPoints;
  }
  
  // Helper function to calculate polygon centroid
  function getCentroid(points: Point[]): Point {
    const sum = points.reduce((acc, p) => ({ 
      lat: acc.lat + p.lat, 
      lng: acc.lng + p.lng 
    }), { lat: 0, lng: 0 });
    
    return {
      lat: sum.lat / points.length,
      lng: sum.lng / points.length
    };
  }
  
  if (!showControls) return null;
  
  return (
    <div className="absolute bottom-6 right-6 z-20 bg-white rounded-xl shadow-lg w-[280px]">
      {/* Header */}
      <div className="bg-purple-600 px-4 py-3">
        <h3 className="text-base font-medium text-white">Trigger Band Controls</h3>
      </div>
      
      {/* Content */}
      <div className="px-4 py-4 flex flex-col space-y-4">
        {/* Instructions */}
        <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg">
          <p>The trigger band is a polygon that sits between your map and walk boundaries. 
          Its corners are positioned at the midpoints between the corresponding corners of your two boundaries.</p>
        </div>
        
        {/* Regenerate Button */}
        <button
          onClick={regenerateTriggerBand}
          disabled={!canGenerateBand}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
            canGenerateBand
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Generate Trigger Band</span>
        </button>
        
        {/* Auto-generation checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoGenerateTriggerBand"
            defaultChecked={true}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="autoGenerateTriggerBand" className="ml-2 block text-sm text-gray-700">
            Auto-generate when map or walk points change
          </label>
        </div>
        
        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            statusType === 'success' ? 'bg-green-50 text-green-700' :
            statusType === 'error' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-800'
          }`}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}