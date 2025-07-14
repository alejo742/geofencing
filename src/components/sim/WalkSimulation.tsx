'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/hooks/useApp';
import { isPointInTriggerBand } from '@/utils/geoUtils';
import { Point } from '@/types';
import type L from 'leaflet';

interface WalkSimulationProps {
  map: L.Map | null;
}

export default function WalkSimulation({ map }: WalkSimulationProps) {
  const { activeStructure } = useApp();
  
  // Simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [speed, setSpeed] = useState(1); // Speed multiplier
  const [inTriggerBand, setInTriggerBand] = useState(false);
  
  // Refs for markers and timers
  const walkerMarkerRef = useRef<L.Marker | null>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);
  const progressLineRef = useRef<L.Polyline | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if we have a valid structure with walk points
  const hasWalkPoints = activeStructure?.walkPoints && activeStructure.walkPoints.length >= 2;
  
  // Check if a point is in any trigger band
  const checkTriggerBands = (point: Point): boolean => {
    if (!activeStructure?.triggerBand) return false;
    
    const { points, thickness } = activeStructure.triggerBand;
    if (points.length < 2) return false;
    
    return isPointInTriggerBand(point, points, thickness);
  };
  
  // Reset simulation
  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentPointIndex(0);
    setInTriggerBand(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      setIsPlaying(true);
      // If we're at the end, reset to start
      if (currentPointIndex >= (activeStructure?.walkPoints.length || 0) - 1) {
        setCurrentPointIndex(0);
      }
    }
  };
  
  // Step forward one point
  const stepForward = () => {
    if (!hasWalkPoints) return;
    
    const nextIndex = Math.min(
      currentPointIndex + 1, 
      activeStructure!.walkPoints.length - 1
    );
    setCurrentPointIndex(nextIndex);
  };
  
  // Step backward one point
  const stepBackward = () => {
    if (!hasWalkPoints) return;
    
    const prevIndex = Math.max(currentPointIndex - 1, 0);
    setCurrentPointIndex(prevIndex);
  };
  
  // Update walker position and check for trigger band
  useEffect(() => {
    if (!map || !activeStructure || !hasWalkPoints) return;
    
    const currentPoint = activeStructure.walkPoints[currentPointIndex];
    if (!currentPoint) return;
    
    // Check if we're in a trigger band
    const triggered = checkTriggerBands(currentPoint);
    setInTriggerBand(triggered);
    
    // Update walker marker
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      
      // Remove existing marker
      if (walkerMarkerRef.current && map.hasLayer(walkerMarkerRef.current)) {
        map.removeLayer(walkerMarkerRef.current);
      }
      
      // Create new marker with pulsing effect when in trigger band
      const html = triggered
        ? `<div class="relative">
             <div class="absolute w-full h-full rounded-full bg-red-400 animate-ping"></div>
             <div class="relative w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                 <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
               </svg>
             </div>
           </div>`
        : `<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
               <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
             </svg>
           </div>`;
      
      const walkerIcon = L.divIcon({
        className: 'walker-icon',
        html,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      const marker = L.marker([currentPoint.lat, currentPoint.lng], { icon: walkerIcon }).addTo(map);
      walkerMarkerRef.current = marker;
      
      // Update progress line
      if (progressLineRef.current && map.hasLayer(progressLineRef.current)) {
        map.removeLayer(progressLineRef.current);
      }
      
      const progressPoints = activeStructure.walkPoints.slice(0, currentPointIndex + 1);
      if (progressPoints.length >= 2) {
        const latLngs = progressPoints.map(p => [p.lat, p.lng]);
        const progressLine = L.polyline(latLngs, {
          color: triggered ? '#ef4444' : '#3b82f6',
          weight: 4,
          opacity: 0.8
        }).addTo(map);
        progressLineRef.current = progressLine;
      }
      
      // Center map on current position if playing
      if (isPlaying) {
        map.panTo([currentPoint.lat, currentPoint.lng]);
      }
    }
  }, [map, activeStructure, currentPointIndex, hasWalkPoints, isPlaying]);
  
  // Draw complete walk path
  useEffect(() => {
    if (!map || !activeStructure || !hasWalkPoints) return;
    
    // Draw the complete path
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      
      // Remove existing path
      if (pathLineRef.current && map.hasLayer(pathLineRef.current)) {
        map.removeLayer(pathLineRef.current);
      }
      
      // Draw the full path
      const latLngs = activeStructure.walkPoints.map(p => [p.lat, p.lng]);
      const pathLine = L.polyline(latLngs, {
        color: '#9ca3af', // Gray
        weight: 2,
        opacity: 0.6,
        dashArray: '4, 4'
      }).addTo(map);
      pathLineRef.current = pathLine;
    }
    
    // Clean up on unmount or when structure changes
    return () => {
      if (map) {
        if (walkerMarkerRef.current && map.hasLayer(walkerMarkerRef.current)) {
          map.removeLayer(walkerMarkerRef.current);
        }
        if (pathLineRef.current && map.hasLayer(pathLineRef.current)) {
          map.removeLayer(pathLineRef.current);
        }
        if (progressLineRef.current && map.hasLayer(progressLineRef.current)) {
          map.removeLayer(progressLineRef.current);
        }
      }
      
      // Clear any timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [map, activeStructure, hasWalkPoints]);
  
  // Handle auto-stepping when playing
  useEffect(() => {
    if (!isPlaying || !hasWalkPoints) return;
    
    // Calculate time to next point (based on speed)
    const baseInterval = 1000; // 1 second
    const interval = baseInterval / speed;
    
    timerRef.current = setTimeout(() => {
      // If we reached the end, stop
      if (currentPointIndex >= (activeStructure?.walkPoints.length || 0) - 1) {
        setIsPlaying(false);
        return;
      }
      
      // Otherwise, move to next point
      setCurrentPointIndex(prev => prev + 1);
    }, interval);
    
    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentPointIndex, activeStructure, hasWalkPoints, speed]);
  
  // Don't render if no walk points
  if (!hasWalkPoints) return null;
  
  return (
    <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 bg-white rounded-xl shadow-lg p-3">
      <div className="flex items-center space-x-2">
        <button
          onClick={stepBackward}
          disabled={currentPointIndex === 0 || isPlaying}
          className="p-2 rounded-full bg-gray-100 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={togglePlay}
          className={`p-2 rounded-full ${isPlaying ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <button
          onClick={stepForward}
          disabled={currentPointIndex === activeStructure.walkPoints.length - 1 || isPlaying}
          className="p-2 rounded-full bg-gray-100 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={resetSimulation}
          className="p-2 rounded-full bg-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="flex items-center ml-2">
          <span className="text-xs mr-2">Speed:</span>
          <select 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-sm py-1 px-2 border rounded"
            disabled={isPlaying}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
          </select>
        </div>
        
        <div className="ml-2 px-3 rounded bg-gray-100 text-sm">
          Point {currentPointIndex + 1}/{activeStructure.walkPoints.length}
        </div>
        
        {inTriggerBand && (
          <div className="ml-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center">
            <span className="animate-pulse mr-1">●</span>
            In Trigger Band
          </div>
        )}
      </div>
    </div>
  );
}