'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';

interface TriggerBandControlsProps {
  map: L.Map | null;
}

export default function TriggerBandControls({ map }: TriggerBandControlsProps) {
  const { 
    activeStructure, 
    mapMode, 
    updateTriggerBandThickness 
  } = useApp();
  
  const [thickness, setThickness] = useState(
    activeStructure?.triggerBand?.thickness || 5
  );
  
  // Update thickness value when active structure changes
  useEffect(() => {
    if (activeStructure?.triggerBand) {
      setThickness(activeStructure.triggerBand.thickness || 5);
    }
  }, [activeStructure]);
  
  // Handle thickness change
  const handleThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThickness = parseInt(e.target.value) || 1;
    setThickness(newThickness);
  };
  
  // Apply thickness to active structure
  const applyThickness = () => {
    if (!activeStructure) return;
    updateTriggerBandThickness(thickness);
  };
  
  // Don't render if not in trigger band mode or no active structure
  if (mapMode !== 'triggerBand' || !activeStructure) return null;
  
  return (
    <div className="absolute top-16 left-4 z-20 bg-white rounded shadow-md">
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Trigger Band Thickness
        </h3>
        
        <div className="flex items-center space-x-3 mb-2">
          <input
            type="range"
            min="1"
            max="20"
            value={thickness}
            onChange={handleThicknessChange}
            className="w-32"
          />
          <span className="text-sm font-medium">{thickness}m</span>
        </div>
        
        <button
          onClick={applyThickness}
          className="px-3 py-1.5 w-full rounded text-sm font-medium bg-purple-600 text-white hover:bg-purple-700"
        >
          Apply Thickness
        </button>
        
        <div className="mt-3 text-xs text-gray-600">
          Click on map to add trigger band points. 
          The band will follow these points with the specified thickness.
        </div>
      </div>
    </div>
  );
}