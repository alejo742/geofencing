'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/hooks/useApp';
import { useGeolocation } from '@/hooks/useGeolocation';
import type L from 'leaflet';

interface WalkControlsProps {
  map: L.Map | null;
}

export default function WalkControls({ map }: WalkControlsProps) {
  const { 
    activeStructure, 
    addPointToStructure,
    mapMode,
    setMapMode
  } = useApp();
  
  const {
    position,
    error,
    accuracy,
    isTracking,
    startTracking,
    stopTracking
  } = useGeolocation();
  
  const [isWalking, setIsWalking] = useState(false);
  const [autoRecording, setAutoRecording] = useState(false);
  const [recordInterval, setRecordInterval] = useState(5); // seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  
  // Start or stop walking mode
  const toggleWalkingMode = () => {
    if (isWalking) {
      // Stop walking mode
      setIsWalking(false);
      stopTracking();
      setAutoRecording(false);
      
      // Reset map mode if we were in walk mode
      if (mapMode === 'walking') {
        setMapMode('view');
      }
      
      // Clear any interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start walking mode
      setIsWalking(true);
      startTracking();
      setMapMode('walking');
    }
  };
  
  // Toggle automatic recording
  const toggleAutoRecording = () => {
    if (!isWalking) return;
    
    if (autoRecording) {
      // Stop auto recording
      setAutoRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start auto recording
      setAutoRecording(true);
      
      // Set up interval to record points
      intervalRef.current = setInterval(() => {
        if (position) {
          addPointToStructure(position, 'walk');
        }
      }, recordInterval * 1000);
    }
  };
  
  // Manually record current position
  const recordCurrentPosition = () => {
    if (!isWalking || !position) return;
    
    addPointToStructure(position, 'walk');
  };
  
  // Update position marker on map
  useEffect(() => {
    if (!map || !position) return;
    
    // Remove previous marker and circle
    if (positionMarkerRef.current && map.hasLayer(positionMarkerRef.current)) {
      map.removeLayer(positionMarkerRef.current);
      positionMarkerRef.current = null;
    }
    
    if (accuracyCircleRef.current && map.hasLayer(accuracyCircleRef.current)) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }
    
    // Only create if Leaflet is available
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      
      // Add position marker
      const marker = L.marker([position.lat, position.lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="marker-pin bg-red-500 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">
                  <span class="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span>📍</span>
                </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
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
          weight: 1
        }).addTo(map);
        accuracyCircleRef.current = circle;
      }
      
      // Center map on position if in walking mode
      if (isWalking) {
        map.setView([position.lat, position.lng], map.getZoom());
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (positionMarkerRef.current && map.hasLayer(positionMarkerRef.current)) {
        map.removeLayer(positionMarkerRef.current);
      }
      
      if (accuracyCircleRef.current && map.hasLayer(accuracyCircleRef.current)) {
        map.removeLayer(accuracyCircleRef.current);
      }
    };
  }, [map, position, accuracy, isWalking]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);
  
  // Don't render controls if no active structure
  if (!activeStructure) return null;
  
  return (
    <div className="absolute bottom-28 left-4 z-20 bg-white rounded shadow-md">
      <div className="p-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Walking Mode</h3>
        
        <div className="flex flex-col space-y-2">
          <button
            onClick={toggleWalkingMode}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              isWalking
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isWalking ? 'Stop Walking' : 'Start Walking'}
          </button>
          
          {isWalking && (
            <>
              <button
                onClick={toggleAutoRecording}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  autoRecording
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {autoRecording ? 'Stop Auto Recording' : 'Start Auto Recording'}
              </button>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-700">
                  Interval (sec):
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={recordInterval}
                  onChange={(e) => setRecordInterval(parseInt(e.target.value) || 5)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  disabled={autoRecording}
                />
              </div>
              
              <button
                onClick={recordCurrentPosition}
                disabled={autoRecording}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  autoRecording
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Record Current Position
              </button>
              
              {error && (
                <div className="mt-2 p-2 bg-red-100 text-red-800 text-xs rounded">
                  Error: {error}
                </div>
              )}
              
              {position && (
                <div className="mt-2 p-2 bg-gray-50 text-xs rounded">
                  <div>Lat: {position.lat.toFixed(6)}</div>
                  <div>Lng: {position.lng.toFixed(6)}</div>
                  {accuracy && <div>Accuracy: ±{accuracy.toFixed(1)}m</div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}