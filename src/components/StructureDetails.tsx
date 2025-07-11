'use client';

import { useApp } from '@/hooks/useApp';
import { formatDate, formatArea } from '@/utils/formatters';
import { calculateAreaInSquareMeters } from '@/utils/mapUtils';
import { useState, useEffect } from 'react';

export default function StructureDetails() {
  const { activeStructure, updateStructure } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize edit form when active structure changes
  useEffect(() => {
    if (activeStructure) {
      setName(activeStructure.name);
    }
    setIsEditing(false);
  }, [activeStructure]);

  // Don't render real content during SSR
  if (!isClient) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded mb-3"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!activeStructure) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a structure to view details
      </div>
    );
  }

  // Calculate area if we have enough points
  const area = activeStructure.mapPoints.length >= 3 
    ? calculateAreaInSquareMeters(activeStructure.mapPoints)
    : 0;

  const handleSaveName = () => {
    if (name.trim() && activeStructure) {
      updateStructure({
        ...activeStructure,
        name: name.trim()
      });
      setIsEditing(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        {isEditing ? (
          <div className="flex items-center space-x-2 w-full">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="px-2 py-1 bg-green-600 text-white rounded text-xs"
            >
              Save
            </button>
            <button
              onClick={() => {
                setName(activeStructure.name);
                setIsEditing(false);
              }}
              className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-medium text-gray-900">{activeStructure.name}</h3>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Edit
            </button>
          </>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mb-3">
        Last modified: {formatDate(activeStructure.lastModified)}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-medium text-gray-700">Map Points</div>
          <div className="text-2xl font-bold text-green-600">
            {activeStructure.mapPoints.length}
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-medium text-gray-700">Walk Points</div>
          <div className="text-2xl font-bold text-blue-600">
            {activeStructure.walkPoints.length}
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-medium text-gray-700">Trigger Points</div>
          <div className="text-2xl font-bold text-purple-600">
            {activeStructure.triggerBand?.points.length || 0}
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-medium text-gray-700">Area</div>
          <div className="text-2xl font-bold text-amber-600">
            {area > 0 ? formatArea(area) : 'N/A'}
          </div>
        </div>
      </div>

      {activeStructure.mapPoints.length < 3 && (
        <div className="mt-3 p-2 bg-yellow-50 text-yellow-800 text-xs rounded">
          Add at least 3 map points to create a complete structure.
        </div>
      )}
    </div>
  );
}