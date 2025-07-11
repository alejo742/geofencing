'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { MapMode } from '@/types';

interface PointActionsProps {
  map: L.Map | null;
}

export default function PointActions({ map }: PointActionsProps) {
  const { 
    activeStructure, 
    mapMode, 
    setMapMode,
    deletePointFromStructure
  } = useApp();
  
  // Determine if editing is possible
  const canEdit = !!activeStructure;
  
  // Handle mode toggle
  const toggleMode = (newMode: MapMode) => {
    setMapMode(mapMode === newMode ? 'view' : newMode);
  };
  
  return (
    <div className="absolute bottom-4 left-4 z-20 bg-white rounded shadow-md">
      <div className="p-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Point Controls</h3>
        
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => toggleMode('addMapPoints')}
            disabled={!canEdit}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              mapMode === 'addMapPoints'
                ? 'bg-green-600 text-white'
                : canEdit
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {mapMode === 'addMapPoints' ? 'Cancel Add Points' : 'Add Map Points'}
          </button>
          
          <button
            onClick={() => toggleMode('addWalkPoints')}
            disabled={!canEdit}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              mapMode === 'addWalkPoints'
                ? 'bg-blue-600 text-white'
                : canEdit
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {mapMode === 'addWalkPoints' ? 'Cancel Walk Points' : 'Add Walk Points'}
          </button>
          
          <button
            onClick={() => toggleMode('editPoints')}
            disabled={!canEdit || 
              (!activeStructure?.mapPoints.length && !activeStructure?.walkPoints.length)}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              mapMode === 'editPoints'
                ? 'bg-amber-600 text-white'
                : canEdit && (activeStructure?.mapPoints.length || activeStructure?.walkPoints.length)
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {mapMode === 'editPoints' ? 'Done Editing' : 'Edit Points'}
          </button>
          
          <button
            onClick={() => toggleMode('triggerBand')}
            disabled={!canEdit}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              mapMode === 'triggerBand'
                ? 'bg-purple-600 text-white'
                : canEdit
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {mapMode === 'triggerBand' ? 'Done Trigger Band' : 'Edit Trigger Band'}
          </button>
        </div>
        
        {mapMode !== 'view' && (
          <div className="mt-3 bg-gray-50 p-2 rounded text-xs text-gray-600">
            {mapMode === 'addMapPoints' && 'Click on the map to add structure boundary points'}
            {mapMode === 'addWalkPoints' && 'Click to add walk points inside the structure'}
            {mapMode === 'editPoints' && 'Drag points to move them, click points to delete'}
            {mapMode === 'triggerBand' && 'Click to add trigger band points'}
          </div>
        )}
      </div>
    </div>
  );
}