'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/hooks/useApp';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapMode } from '@/types';
import type L from 'leaflet';

interface MapControlsProps {
  map: L.Map | null;
}

export default function MapControls({ map }: MapControlsProps) {
  const [activeTab, setActiveTab] = useState<'structure' | 'walking'>('structure');
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  
  // Get all the app context and geolocation hooks
  const { 
    activeStructure, 
    mapMode, 
    setMapMode,
    undoLastAction,
    canUndo,
    addPointToStructure
  } = useApp();
  
  const {
    position,
    error,
    accuracy,
    isTracking,
    startTracking,
    stopTracking
  } = useGeolocation();
  
  // Walking mode state
  const [isWalking, setIsWalking] = useState(false);
  const [autoRecording, setAutoRecording] = useState(false);
  const [recordInterval, setRecordInterval] = useState(5); // seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  
  // Structure control functions
  const canEdit = !!activeStructure;
  
  const toggleMode = (newMode: MapMode) => {
    setMapMode(mapMode === newMode ? 'view' : newMode);
  };
  
  // Walking mode functions
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
          html: `<div class="marker-pin bg-red-500 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs relative">
                  <span class="animate-ping absolute w-full h-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative">📍</span>
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
      if (positionMarkerRef.current && map && map.hasLayer(positionMarkerRef.current)) {
        map.removeLayer(positionMarkerRef.current);
      }
      
      if (accuracyCircleRef.current && map && map.hasLayer(accuracyCircleRef.current)) {
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
  
  // Determine panel position based on screen size
  const positionClasses = isMobile
    ? "bottom-4 left-4 right-4 max-w-full"
    : activeTab === 'structure'
      ? "bottom-6 left-6 sm:w-[280px]"
      : "bottom-6 right-6 sm:w-[280px]";
  
  return (
    <div className={`absolute z-20 bg-white rounded-xl shadow-lg ${positionClasses}`}>
      {/* Tab Navigation - Only visible on mobile */}
      {isMobile && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex-1 text-sm font-medium py-2 text-center ${
              activeTab === 'structure'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Structure
          </button>
          <button
            onClick={() => setActiveTab('walking')}
            className={`flex-1 text-sm font-medium py-2 text-center ${
              activeTab === 'walking'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            GPS Walking
          </button>
        </div>
      )}
      
      {/* Structure Controls Tab */}
      {(!isMobile || activeTab === 'structure') && (
        <>
          {/* Header */}
          <div className="bg-green-600 px-4 py-3">
            <h3 className="text-base font-medium text-white">Structure Controls</h3>
          </div>
          
          {/* Content */}
          <div className="px-4 py-4 flex flex-col space-y-3 max-h-[calc(50vh-70px)] sm:max-h-[500px] overflow-y-auto">
            {/* Map Points Button */}
            <button
              onClick={() => toggleMode('addMapPoints')}
              disabled={!canEdit}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                mapMode === 'addMapPoints'
                  ? 'bg-green-600 text-white'
                  : canEdit
                  ? 'bg-white border-2 border-green-200 text-green-800 hover:bg-green-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                {mapMode === 'addMapPoints' ? 'Cancel Add Points' : 'Add Map Points'}
              </span>
            </button>
            
            {/* Walk Points Button */}
            <button
              onClick={() => toggleMode('addWalkPoints')}
              disabled={!canEdit}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                mapMode === 'addWalkPoints'
                  ? 'bg-blue-600 text-white'
                  : canEdit
                  ? 'bg-white border-2 border-blue-200 text-blue-800 hover:bg-blue-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span className="text-sm font-medium">
                {mapMode === 'addWalkPoints' ? 'Cancel Walk Points' : 'Add Walk Points'}
              </span>
            </button>
            
            {/* Edit Points Button */}
            <button
              onClick={() => toggleMode('editPoints')}
              disabled={!canEdit || 
                (!activeStructure?.mapPoints.length && !activeStructure?.walkPoints.length)}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                mapMode === 'editPoints'
                  ? 'bg-amber-600 text-white'
                  : canEdit && (activeStructure?.mapPoints.length || activeStructure?.walkPoints.length)
                  ? 'bg-white border-2 border-amber-200 text-amber-800 hover:bg-amber-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span className="text-sm font-medium">
                {mapMode === 'editPoints' ? 'Done Editing' : 'Edit Points'}
              </span>
            </button>
            
            {/* Trigger Band Button */}
            <button
              onClick={() => toggleMode('triggerBand')}
              disabled={!canEdit}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                mapMode === 'triggerBand'
                  ? 'bg-purple-600 text-white'
                  : canEdit
                  ? 'bg-white border-2 border-purple-200 text-purple-800 hover:bg-purple-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              <span className="text-sm font-medium">
                {mapMode === 'triggerBand' ? 'Done Trigger Band' : 'Edit Trigger Band'}
              </span>
            </button>
            
            {/* Undo Button - Only show when in point adding modes */}
            {(mapMode === 'addMapPoints' || mapMode === 'addWalkPoints' || mapMode === 'triggerBand') && (
              <div className="pt-3 mt-2 border-t border-gray-200">
                <button
                  onClick={undoLastAction}
                  disabled={!canUndo}
                  className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                    canUndo
                      ? 'bg-amber-50 text-amber-800 border-2 border-amber-200 hover:bg-amber-100' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Undo Last Point</span>
                </button>
              </div>
            )}
            
            {/* Instructions */}
            {mapMode !== 'view' && mapMode !== 'walking' && (
              <div className="p-3 mt-2 bg-blue-50 text-blue-800 text-sm rounded-lg">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {mapMode === 'addMapPoints' && 'Click on the map to add structure boundary points.'}
                    {mapMode === 'addWalkPoints' && 'Click to add walk points inside the structure.'}
                    {mapMode === 'editPoints' && 'Drag points to move them. Click to delete.'}
                    {mapMode === 'triggerBand' && 'Click to add trigger band points along the route.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* GPS Walking Controls Tab */}
      {(!isMobile || activeTab === 'walking') && (
        <>
          {/* Header */}
          <div className="bg-green-600 px-4 py-3">
            <h3 className="text-base font-medium text-white">GPS Walking Mode</h3>
          </div>
          
          {/* Content */}
          <div className="px-4 py-4 flex flex-col space-y-3 max-h-[calc(50vh-70px)] sm:max-h-[500px] overflow-y-auto">
            {/* Start/Stop Walking Button */}
            <button
              onClick={toggleWalkingMode}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                isWalking
                  ? 'bg-red-600 text-white'
                  : 'bg-white border-2 border-green-200 text-green-800 hover:bg-green-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                {isWalking ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                )}
              </svg>
              <span className="text-sm font-medium">
                {isWalking ? 'Stop Walking' : 'Start Walking Mode'}
              </span>
            </button>
            
            {isWalking && (
              <>
                <div className="pt-3 mt-2 border-t border-gray-200 flex flex-col space-y-3">
                  {/* Auto Recording Button */}
                  <button
                    onClick={toggleAutoRecording}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                      autoRecording
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border-2 border-amber-200 text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      {autoRecording ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span className="text-sm font-medium">
                      {autoRecording ? 'Stop Auto Recording' : 'Start Auto Recording'}
                    </span>
                  </button>
                  
                  {/* Interval Slider */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Recording Interval</label>
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={recordInterval}
                          onChange={(e) => setRecordInterval(parseInt(e.target.value) || 5)}
                          className="flex-grow"
                          disabled={autoRecording}
                        />
                        <span className="ml-3 px-2 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 min-w-[40px] text-center">
                          {recordInterval}s
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Manual Recording Button */}
                  <button
                    onClick={recordCurrentPosition}
                    disabled={autoRecording}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                      autoRecording
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Record Current Position</span>
                  </button>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 text-red-800 text-sm rounded-lg flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}
                  
                  {/* Position Display */}
                  {position && (
                    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700">GPS Position</h4>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Latitude</span>
                          <span className="font-mono text-sm">{position.lat.toFixed(6)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Longitude</span>
                          <span className="font-mono text-sm">{position.lng.toFixed(6)}</span>
                        </div>
                        {accuracy && (
                          <div className="col-span-2 flex flex-col">
                            <span className="text-xs text-gray-500">Accuracy</span>
                            <span className="flex items-center text-sm">
                              ±{accuracy.toFixed(1)} meters
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}