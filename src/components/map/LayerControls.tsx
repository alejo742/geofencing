'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';

export default function LayerControls() {
  const { activeStructure } = useApp();
  const [visibleLayers, setVisibleLayers] = useState({
    mapPoints: true,
    walkPoints: true,
    triggerBand: true
  });

  // Only show when we have an active structure
  if (!activeStructure) return null;

  const toggleLayer = (layer: keyof typeof visibleLayers) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
    
    // Dispatch a custom event that the map layers can listen for
    window.dispatchEvent(new CustomEvent('layer-visibility-change', {
      detail: {
        layer,
        visible: !visibleLayers[layer]
      }
    }));
  };

  return (
    <div className="absolute top-20 right-4 z-20 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 px-3 py-2">
        <h3 className="text-sm font-medium text-white">Layer Visibility</h3>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 flex items-center">
            <div className="w-3 h-3 bg-green-500 mr-2"></div>
            Map Boundary
          </label>
          <button 
            onClick={() => toggleLayer('mapPoints')}
            className={`relative inline-flex h-5 w-10 items-center rounded-full ${visibleLayers.mapPoints ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${visibleLayers.mapPoints ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 flex items-center">
            <div className="w-3 h-3 bg-blue-500 mr-2"></div>
            Walk Boundary
          </label>
          <button 
            onClick={() => toggleLayer('walkPoints')}
            className={`relative inline-flex h-5 w-10 items-center rounded-full ${visibleLayers.walkPoints ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${visibleLayers.walkPoints ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 flex items-center">
            <div className="w-3 h-3 bg-purple-500 mr-2"></div>
            Trigger Band
          </label>
          <button 
            onClick={() => toggleLayer('triggerBand')}
            className={`relative inline-flex h-5 w-10 items-center rounded-full ${visibleLayers.triggerBand ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${visibleLayers.triggerBand ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}