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
    undoLastAction,
    canUndo
  } = useApp();
  
  const canEdit = !!activeStructure;
  const toggleMode = (newMode: MapMode) => {
    setMapMode(mapMode === newMode ? 'view' : newMode);
  };
  
  return (
    <div className="absolute bottom-6 left-6 max-sm:bottom-30 z-20 bg-white rounded-xl shadow-lg" style={{width: '280px'}}>
      {/* Header */}
      <div className="bg-green-600 px-4 py-3">
        <h3 className="text-base font-medium text-white">Structure Controls</h3>
      </div>
      
      {/* Content */}
      <div className="px-4 py-4 flex flex-col space-y-3">
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
        {mapMode !== 'view' && (
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
    </div>
  );
}