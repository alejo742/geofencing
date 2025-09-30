'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { exportData } from '@/utils/exportUtils';
import { Download, FileText, MapPin } from 'lucide-react';

type BoundaryType = 'mapPoints' | 'walkPoints' | 'triggerBand';

export default function ExportButton() {
  const { structures } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [geojsonBoundary, setGeojsonBoundary] = useState<BoundaryType>('mapPoints');

  const handleExport = (format: 'geojson' | 'custom') => {
    if (format === 'geojson') {
      exportData(structures, format, { boundaryType: geojsonBoundary });
    } else {
      exportData(structures, format);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow-md border border-gray-300 hover:bg-gray-50 flex items-center"
      >
        <Download className="h-5 w-5 mr-2 text-gray-600" />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-2 z-30">
          <button
            onClick={() => handleExport('custom')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-lg flex items-center"
          >
            <FileText className="h-5 w-5 mr-2 text-gray-600" />
            App Format (.json)
          </button>
          <div className="border-t my-2"></div>
          <label className="block text-xs text-gray-500 mb-1 px-2">GeoJSON Boundary Type</label>
          <select
            value={geojsonBoundary}
            onChange={e => setGeojsonBoundary(e.target.value as BoundaryType)}
            className="w-full px-2 py-1 mb-2 border rounded focus:outline-none text-sm"
          >
            <option value="mapPoints">Map Boundary (mapPoints)</option>
            <option value="walkPoints">Walk Path (walkPoints)</option>
            <option value="triggerBand">Trigger Band (triggerBand)</option>
          </select>
          <button
            onClick={() => handleExport('geojson')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-lg flex items-center"
          >
            <MapPin className="h-5 w-5 mr-2 text-gray-600" />
            GeoJSON Format (.geojson)
          </button>
        </div>
      )}
    </div>
  );
}